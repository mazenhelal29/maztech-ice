import { supabase } from '../lib/supabase'

export const recipesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('recipes')
      .select(`*, products(name), recipe_items(*, raw_materials(name, unit, cost_per_unit))`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getByProduct(productId) {
    const { data, error } = await supabase
      .from('recipes')
      .select(`*, recipe_items(*, raw_materials(name, unit, cost_per_unit))`)
      .eq('product_id', productId)
      .single()
    if (error) return null
    return data
  },

  async create(productId, items) {
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([{ product_id: productId }])
      .select()
      .single()
    if (recipeError) throw recipeError

    const recipeItems = items.map((item) => ({
      recipe_id: recipe.id,
      raw_material_id: item.raw_material_id,
      quantity: item.quantity,
    }))
    const { error: itemsError } = await supabase.from('recipe_items').insert(recipeItems)
    if (itemsError) throw itemsError
    return recipe
  },

  async update(recipeId, items) {
    await supabase.from('recipe_items').delete().eq('recipe_id', recipeId)
    const recipeItems = items.map((item) => ({
      recipe_id: recipeId,
      raw_material_id: item.raw_material_id,
      quantity: item.quantity,
    }))
    const { error } = await supabase.from('recipe_items').insert(recipeItems)
    if (error) throw error
  },

  async delete(id) {
    await supabase.from('recipe_items').delete().eq('recipe_id', id)
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw error
  },
}
