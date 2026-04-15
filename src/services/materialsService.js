import { supabase } from '../lib/supabase'

export const materialsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(material) {
    const { data, error } = await supabase.from('raw_materials').insert([material]).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('raw_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (error) throw error
  },

  async getLowStock() {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
      .filter('quantity', 'lt', supabase.raw('min_quantity'))
    if (error) throw error
    return data
  },
}
