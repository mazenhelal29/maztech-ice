import { supabase } from '../lib/supabase'

export const salesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales')
      .select(`*, customers(name, phone), sale_items(*, products(name))`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(customerId, items) {
    const { data, error } = await supabase.rpc('handle_sale', {
      p_customer_id: customerId,
      p_items: items
    })

    if (error) throw error
    if (!data.success) throw new Error(data.error)

    return data
  },

  async delete(id) {
    await supabase.from('sale_items').delete().eq('sale_id', id)
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) throw error
  },
}

export const customersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(customer) {
    const { data, error } = await supabase.from('customers').insert([customer]).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
  },
}
