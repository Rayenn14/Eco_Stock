/**
 * Tests pour les fonctions helpers des recettes
 */

describe('Utils: Recipe Helpers', () => {
  describe('Recipe filtering', () => {
    it('should filter recipes by search query', () => {
      const recipes = [
        { id: '1', nom: 'Salade de tomates', ingredients: ['tomate', 'oignon'] },
        { id: '2', nom: 'Soupe aux légumes', ingredients: ['carotte', 'poireau'] },
        { id: '3', nom: 'Tarte aux tomates', ingredients: ['tomate', 'pâte'] },
      ];

      const searchQuery = 'tomate';
      const filtered = recipes.filter(r =>
        r.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(r => r.id)).toEqual(['1', '3']);
    });

    it('should filter recipes by available ingredients', () => {
      const recipes = [
        { id: '1', ingredients: ['tomate', 'oignon'] },
        { id: '2', ingredients: ['carotte', 'poireau'] },
        { id: '3', ingredients: ['tomate', 'carotte'] },
      ];

      const availableIngredients = ['tomate', 'oignon', 'sel'];

      const filtered = recipes.filter(recipe =>
        recipe.ingredients.every(ing => availableIngredients.includes(ing))
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter recipes by category', () => {
      const recipes = [
        { id: '1', nom: 'Salade', categorie_id: 1 },
        { id: '2', nom: 'Soupe', categorie_id: 2 },
        { id: '3', nom: 'Tarte', categorie_id: 1 },
      ];

      const categoryId = 1;
      const filtered = recipes.filter(r => r.categorie_id === categoryId);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(r => r.nom)).toEqual(['Salade', 'Tarte']);
    });

    it('should calculate recipe matching score', () => {
      const recipe = {
        ingredients: ['tomate', 'oignon', 'basilic', 'huile']
      };
      const userIngredients = ['tomate', 'oignon', 'sel'];

      const matchingCount = recipe.ingredients.filter(ing =>
        userIngredients.includes(ing)
      ).length;
      const matchScore = (matchingCount / recipe.ingredients.length) * 100;

      expect(matchScore).toBeCloseTo(50, 0); // 2/4 = 50%
    });

    it('should sort recipes by matching score', () => {
      const recipes = [
        { id: '1', ingredients: ['tomate', 'oignon'] },
        { id: '2', ingredients: ['tomate', 'oignon', 'basilic', 'huile'] },
        { id: '3', ingredients: ['tomate'] },
      ];
      const userIngredients = ['tomate', 'oignon'];

      const scored = recipes.map(recipe => {
        const matchCount = recipe.ingredients.filter(ing =>
          userIngredients.includes(ing)
        ).length;
        return {
          ...recipe,
          score: (matchCount / recipe.ingredients.length) * 100
        };
      }).sort((a, b) => b.score - a.score);

      // First two have 100% match (order may vary)
      expect([scored[0].id, scored[1].id].sort()).toEqual(['1', '3']);
      expect(scored[2].id).toBe('2'); // 50% match
    });
  });

  describe('Recipe validation', () => {
    it('should validate recipe has required fields', () => {
      const validRecipe = {
        nom: 'Salade',
        description: 'Une bonne salade',
        ingredients: ['tomate'],
        etapes: ['Couper', 'Mélanger']
      };

      expect(validRecipe.nom).toBeDefined();
      expect(validRecipe.nom.length).toBeGreaterThan(0);
      expect(validRecipe.ingredients.length).toBeGreaterThan(0);
      expect(validRecipe.etapes.length).toBeGreaterThan(0);
    });

    it('should reject recipe with empty name', () => {
      const recipe = { nom: '' };
      const isValid = !!(recipe.nom && recipe.nom.trim().length > 0);

      expect(isValid).toBe(false);
    });

    it('should reject recipe without ingredients', () => {
      const recipe = { nom: 'Test', ingredients: [] };
      const isValid = recipe.ingredients && recipe.ingredients.length > 0;

      expect(isValid).toBe(false);
    });
  });

  describe('Ingredient matching', () => {
    it('should find missing ingredients for recipe', () => {
      const recipeIngredients = ['tomate', 'oignon', 'basilic', 'huile'];
      const userIngredients = ['tomate', 'oignon'];

      const missing = recipeIngredients.filter(ing =>
        !userIngredients.includes(ing)
      );

      expect(missing).toHaveLength(2);
      expect(missing).toEqual(['basilic', 'huile']);
    });

    it('should check if user can make recipe', () => {
      const recipeIngredients = ['tomate', 'oignon'];
      const userIngredients = ['tomate', 'oignon', 'sel', 'poivre'];

      const canMake = recipeIngredients.every(ing =>
        userIngredients.includes(ing)
      );

      expect(canMake).toBe(true);
    });

    it('should handle partial ingredient matches', () => {
      const recipeIngredient = 'tomate';
      const userIngredients = ['tomate cerise', 'tomate'];

      const hasMatch = userIngredients.some(ing =>
        ing.toLowerCase().includes(recipeIngredient.toLowerCase())
      );

      expect(hasMatch).toBe(true);
    });
  });

  describe('Recipe preparation time', () => {
    it('should calculate total preparation time', () => {
      const recipe = {
        temps_preparation: 15, // minutes
        temps_cuisson: 30
      };

      const totalTime = recipe.temps_preparation + recipe.temps_cuisson;

      expect(totalTime).toBe(45);
    });

    it('should format time display', () => {
      const minutes = 75;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      const formatted = hours > 0
        ? `${hours}h${mins > 0 ? mins : ''}`
        : `${mins}min`;

      expect(formatted).toBe('1h15');
    });

    it('should handle time less than hour', () => {
      const minutes = 30;
      const formatted = minutes < 60 ? `${minutes}min` : `${Math.floor(minutes / 60)}h${minutes % 60}`;

      expect(formatted).toBe('30min');
    });
  });
});
