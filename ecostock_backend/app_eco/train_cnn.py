"""
Entrainement CNN V2 - Avec detection Out-of-Distribution
=========================================================
Sauvegarde les prototypes de classe pour rejeter les images inconnues
"""

import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from pathlib import Path
import numpy as np

def train_cnn_with_prototypes():
    print("=" * 60)
    print("ENTRAINEMENT CNN V2 - AVEC PROTOTYPES OOD")
    print("=" * 60)

    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\nDevice: {device}")
    if device.type == 'cuda':
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    # Parametres
    data_dir = Path("data/cnn_spices")
    model_dir = Path("models/cnn_spices")
    model_dir.mkdir(parents=True, exist_ok=True)

    batch_size = 16
    epochs = 30
    learning_rate = 0.001
    img_size = 224

    # Augmentation pour le train
    train_transform = transforms.Compose([
        transforms.Resize((img_size + 32, img_size + 32)),
        transforms.RandomCrop(img_size),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Charger datasets
    print("\nChargement des donnees...")
    train_dataset = datasets.ImageFolder(data_dir / "train", transform=train_transform)
    val_dataset = datasets.ImageFolder(data_dir / "val", transform=val_transform)

    # Dataset sans augmentation pour calculer les prototypes
    train_dataset_clean = datasets.ImageFolder(data_dir / "train", transform=val_transform)

    print(f"Classes: {train_dataset.classes}")
    print(f"Train: {len(train_dataset)} images")
    print(f"Val: {len(val_dataset)} images")

    # Poids de classe
    class_counts = [0] * len(train_dataset.classes)
    for _, label in train_dataset:
        class_counts[label] += 1

    total = sum(class_counts)
    class_weights = torch.FloatTensor([total / (len(class_counts) * c) for c in class_counts]).to(device)

    # DataLoaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    clean_loader = DataLoader(train_dataset_clean, batch_size=batch_size, shuffle=False, num_workers=0)

    # Modele ResNet18
    print("\nChargement du modele ResNet18...")
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

    # Garder une reference a la couche avant FC pour extraire les features
    num_features = model.fc.in_features  # 512 pour ResNet18
    num_classes = len(train_dataset.classes)

    model.fc = nn.Linear(num_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', patience=5, factor=0.5)

    # Entrainement
    print("\n" + "=" * 60)
    print("PHASE 1: ENTRAINEMENT")
    print("=" * 60)

    best_acc = 0.0
    patience_counter = 0
    max_patience = 10

    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()

        train_acc = 100. * train_correct / train_total

        # Validation
        model.eval()
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_acc = 100. * val_correct / val_total
        scheduler.step(val_acc)

        print(f"Epoch {epoch+1:2d}/{epochs} | Train Acc: {train_acc:.1f}% | Val Acc: {val_acc:.1f}%")

        if val_acc > best_acc:
            best_acc = val_acc
            patience_counter = 0
            # Sauvegarder temporairement
            torch.save(model.state_dict(), model_dir / "temp_best.pt")
        else:
            patience_counter += 1

        if patience_counter >= max_patience:
            print(f"\nEarly stopping apres {epoch+1} epochs")
            break

    # Charger le meilleur modele
    model.load_state_dict(torch.load(model_dir / "temp_best.pt", weights_only=True))
    model.eval()

    # PHASE 2: Calculer les prototypes (centroides de classe)
    print("\n" + "=" * 60)
    print("PHASE 2: CALCUL DES PROTOTYPES")
    print("=" * 60)

    # Creer un extracteur de features (sans la derniere couche FC)
    feature_extractor = nn.Sequential(*list(model.children())[:-1])
    feature_extractor.eval()

    # Collecter les features par classe
    class_features = {i: [] for i in range(num_classes)}

    with torch.no_grad():
        for images, labels in clean_loader:
            images = images.to(device)
            features = feature_extractor(images)
            features = features.view(features.size(0), -1)  # Flatten

            for feat, label in zip(features.cpu().numpy(), labels.numpy()):
                class_features[label].append(feat)

    # Calculer les prototypes (moyenne) et les rayons (std)
    prototypes = {}
    radii = {}

    for class_id, features in class_features.items():
        features = np.array(features)
        prototype = features.mean(axis=0)
        prototypes[class_id] = prototype

        # Calculer les distances au prototype
        distances = np.linalg.norm(features - prototype, axis=1)
        # Rayon ULTRA STRICT = moyenne + 0.3*std (couvre ~60% des points)
        radius = distances.mean() + 0.3 * distances.std()
        radii[class_id] = radius

        class_name = train_dataset.classes[class_id]
        print(f"  {class_name}: prototype shape={prototype.shape}, rayon={radius:.2f}")

    # Sauvegarder le modele complet avec prototypes
    print("\n" + "=" * 60)
    print("SAUVEGARDE DU MODELE")
    print("=" * 60)

    checkpoint = {
        'model_state_dict': model.state_dict(),
        'classes': train_dataset.classes,
        'accuracy': best_acc,
        'prototypes': prototypes,
        'radii': radii,
        'num_features': num_features,
        'version': 'v2_with_ood'
    }

    torch.save(checkpoint, model_dir / "best.pt")

    # Nettoyer
    (model_dir / "temp_best.pt").unlink()

    print(f"\nModele sauvegarde: {model_dir}/best.pt")
    print(f"Meilleure accuracy: {best_acc:.1f}%")
    print(f"\nLe modele peut maintenant rejeter les images qui ne sont pas des epices!")


if __name__ == "__main__":
    train_cnn_with_prototypes()
