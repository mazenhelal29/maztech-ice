import { supabase } from '../lib/supabase'

export const productionService = {
  async getAll() {
    const { data, error } = await supabase
      .from('productions')
      .select(`*, products(name)`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(productId, quantity) {
    const { data, error } = await supabase.rpc('handle_production', {
      p_product_id: productId,
      p_quantity: quantity
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error)
    
    return data
  },
}
