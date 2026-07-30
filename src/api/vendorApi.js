
import { supabase } from '../supabaseClient';
import { INITIAL_VENDORS } from '../mock/vendors';

const mapDBToVendor = (v) => {
  if (!v) return null;
  return {
    id: v.id,
    userId: v.user_id || v.userId,
    name: v.name,
    code: v.code,
    contactPerson: v.contact_person || v.contactPerson,
    email: v.email,
    phone: v.phone,
    category: v.category,
    status: v.status,
    score: Number(v.score) || 100,
    address: v.address,
    joinedDate: v.joined_date || v.joinedDate,
    rejectionReason: v.rejection_reason || v.rejectionReason || null,
    onTimeDeliveryRate: v.onTimeDeliveryRate || 100,
    qualityRating: v.qualityRating || 5.0,
    gstin: v.gstin || '',
    pan: v.pan || '',
    documents: v.documents || []
  };
};

const getLocalVendors = () => {
  const stored = localStorage.getItem('procure_vendors');
  if (!stored) {
    localStorage.setItem('procure_vendors', JSON.stringify(INITIAL_VENDORS));
    return INITIAL_VENDORS;
  }
  try {
    const parsed = JSON.parse(stored);
    const vMap = new Map();
    [...INITIAL_VENDORS, ...parsed].forEach(v => vMap.set(v.id, v));
    return Array.from(vMap.values());
  } catch (e) {
    return INITIAL_VENDORS;
  }
};

const saveLocalVendors = (vendors) => {
  localStorage.setItem('procure_vendors', JSON.stringify(vendors));
};

export const vendorApi = {
  getVendors: async () => {
    let vendors = [];
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        vendors = data.map(mapDBToVendor);
      }
    } catch (e) {
      console.warn('[Supabase] getVendors error, using fallback:', e);
    }

    // Merge with local storage fallback if empty or missing records
    const localVendors = getLocalVendors().map(mapDBToVendor);
    const vendorMap = new Map();
    localVendors.forEach(v => vendorMap.set(v.id, v));
    vendors.forEach(v => vendorMap.set(v.id, v));

    return Array.from(vendorMap.values());
  },

  getVendorById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .or(`id.eq.${id},user_id.eq.${id}`);
      if (!error && data && data.length > 0) {
        return mapDBToVendor(data[0]);
      }
    } catch (e) { }

    const local = getLocalVendors().find(v => v.id === id || v.userId === id);
    if (local) return mapDBToVendor(local);
    throw new Error('Vendor not found');
  },

  approveVendor: async (id) => {
    let updated = null;
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({ status: 'Approved', rejection_reason: null })
        .eq('id', id)
        .select('*');
      if (!error && data && data.length > 0) {
        updated = mapDBToVendor(data[0]);
      }
    } catch (e) {
      console.warn('[Supabase] approveVendor fallback:', e);
    }

    // Local storage sync
    const locals = getLocalVendors();
    const idx = locals.findIndex(v => v.id === id);
    if (idx !== -1) {
      locals[idx].status = 'Approved';
      locals[idx].rejectionReason = null;
      saveLocalVendors(locals);
      if (!updated) updated = mapDBToVendor(locals[idx]);
    }

    if (!updated) {
      updated = { id, status: 'Approved' };
    }
    return updated;
  },

  rejectVendor: async (id, reason) => {
    let updated = null;
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({ status: 'Rejected', rejection_reason: reason })
        .eq('id', id)
        .select('*');
      if (!error && data && data.length > 0) {
        updated = mapDBToVendor(data[0]);
      }
    } catch (e) {
      console.warn('[Supabase] rejectVendor fallback:', e);
    }

    // Local storage sync
    const locals = getLocalVendors();
    const idx = locals.findIndex(v => v.id === id);
    if (idx !== -1) {
      locals[idx].status = 'Rejected';
      locals[idx].rejectionReason = reason;
      saveLocalVendors(locals);
      if (!updated) updated = mapDBToVendor(locals[idx]);
    }

    if (!updated) {
      updated = { id, status: 'Rejected', rejectionReason: reason };
    }
    return updated;
  },

  createVendor: async (vendorData) => {
    const dbData = {
      id: vendorData.id || `vnd_custom_${Date.now()}`,
      user_id: vendorData.userId || `usr_vnd_${Date.now()}`,
      name: vendorData.name,
      code: vendorData.code || `VND-CST-${Math.floor(100 + Math.random() * 900)}`,
      contact_person: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      category: vendorData.category,
      status: vendorData.status || 'Approved',
      score: vendorData.score || 100.0,
      address: vendorData.address,
      joined_date: vendorData.joinedDate || new Date().toISOString().split('T')[0]
    };

    let created = null;
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert(dbData)
        .select('*');
      if (!error && data && data.length > 0) {
        created = mapDBToVendor(data[0]);
      }
    } catch (e) { }

    const locals = getLocalVendors();
    const newLocal = {
      id: dbData.id,
      userId: dbData.user_id,
      name: dbData.name,
      code: dbData.code,
      contactPerson: dbData.contact_person,
      email: dbData.email,
      phone: dbData.phone,
      category: dbData.category,
      status: dbData.status,
      score: dbData.score,
      address: dbData.address,
      joinedDate: dbData.joined_date,
      documents: []
    };
    locals.push(newLocal);
    saveLocalVendors(locals);

    return created || mapDBToVendor(newLocal);
  },

  updateVendor: async (id, vendorData) => {
    const updateData = {};
    if (vendorData.name !== undefined) updateData.name = vendorData.name;
    if (vendorData.contactPerson !== undefined) updateData.contact_person = vendorData.contactPerson;
    if (vendorData.email !== undefined) updateData.email = vendorData.email;
    if (vendorData.phone !== undefined) updateData.phone = vendorData.phone;
    if (vendorData.category !== undefined) updateData.category = vendorData.category;
    if (vendorData.status !== undefined) updateData.status = vendorData.status;
    if (vendorData.score !== undefined) updateData.score = vendorData.score;
    if (vendorData.address !== undefined) updateData.address = vendorData.address;

    let updated = null;
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', id)
        .select('*');
      if (!error && data && data.length > 0) {
        updated = mapDBToVendor(data[0]);
      }
    } catch (e) { }

    const locals = getLocalVendors();
    const idx = locals.findIndex(v => v.id === id);
    if (idx !== -1) {
      locals[idx] = { ...locals[idx], ...vendorData };
      saveLocalVendors(locals);
      if (!updated) updated = mapDBToVendor(locals[idx]);
    }

    return updated || { id, ...vendorData };
  },

  deactivateVendor: async (id) => {
    let updated = null;
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({ status: 'Deactivated' })
        .eq('id', id)
        .select('*');
      if (!error && data && data.length > 0) {
        updated = mapDBToVendor(data[0]);
      }
    } catch (e) { }

    const locals = getLocalVendors();
    const idx = locals.findIndex(v => v.id === id);
    if (idx !== -1) {
      locals[idx].status = 'Deactivated';
      saveLocalVendors(locals);
      if (!updated) updated = mapDBToVendor(locals[idx]);
    }

    return updated || { id, status: 'Deactivated' };
  }
};

