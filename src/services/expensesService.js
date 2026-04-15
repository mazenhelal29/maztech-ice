import { supabase } from '../lib/supabase'

export const expensesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async create(expense) {
    const { data, error } = await supabase.from('expenses').insert([expense]).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
  },
}
