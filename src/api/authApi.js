import { supabase } from '../supabaseClient';
import { INITIAL_USERS } from '../mock/users';
import { INITIAL_VENDORS } from '../mock/vendors';

export const authApi = {
  login: async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    // Try fetching user from Supabase first
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail);

      if (!error && users && users.length > 0) {
        user = users[0];
      }
    } catch (e) {
      console.warn('[Supabase] User query error:', e);
    }

    // Fallback to local storage / seed users if not found in Supabase
    if (!user) {
      const storedUsersStr = localStorage.getItem('procure_users');
      let allUsers = INITIAL_USERS;
      if (storedUsersStr) {
        try {
          const parsed = JSON.parse(storedUsersStr);
          // Combine initial and stored users without duplicate IDs
          const userMap = new Map();
          [...INITIAL_USERS, ...parsed].forEach(u => userMap.set(u.id, u));
          allUsers = Array.from(userMap.values());
        } catch (err) {
          console.error('Failed to parse procure_users from localStorage', err);
        }
      }
      user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (!user || user.password !== password) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    // If user is a vendor, check registration approval status
    if (user.role === 'vendor') {
      let vendorStatus = null;
      let rejectionReason = null;

      // Check vendor status in Supabase
      try {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('status, rejection_reason')
          .or(`id.eq.${user.vendor_id || user.vendorId},user_id.eq.${user.id},email.eq.${cleanEmail}`);

        if (vendorData && vendorData.length > 0) {
          vendorStatus = vendorData[0].status;
          rejectionReason = vendorData[0].rejection_reason;
        }
      } catch (e) {
        console.warn('[Supabase] Vendor status check error:', e);
      }

      // Check vendor status in local storage fallback if not found in Supabase
      if (!vendorStatus) {
        const storedVendorsStr = localStorage.getItem('procure_vendors');
        let allVendors = INITIAL_VENDORS;
        if (storedVendorsStr) {
          try {
            const parsed = JSON.parse(storedVendorsStr);
            const vMap = new Map();
            [...INITIAL_VENDORS, ...parsed].forEach(v => vMap.set(v.id, v));
            allVendors = Array.from(vMap.values());
          } catch (err) {
            console.error('Failed to parse procure_vendors from localStorage', err);
          }
        }

        const matchedVendor = allVendors.find(v =>
          v.id === user.vendor_id || v.id === user.vendorId || v.userId === user.id || v.email?.toLowerCase() === cleanEmail
        );

        if (matchedVendor) {
          vendorStatus = matchedVendor.status;
          rejectionReason = matchedVendor.rejectionReason || matchedVendor.rejection_reason;
        }
      }

      // Enforce status checks for vendors
      if (vendorStatus === 'Pending') {
        throw new Error('Your vendor registration is currently pending manager approval. You will be able to access ProcureHub once a procurement manager reviews and approves your request.');
      } else if (vendorStatus === 'Rejected') {
        const reasonText = rejectionReason ? ` Reason: ${rejectionReason}` : '';
        throw new Error(`Your vendor registration request was rejected by the manager.${reasonText}`);
      } else if (vendorStatus === 'Deactivated') {
        throw new Error('Your vendor account has been deactivated. Please contact your procurement manager for assistance.');
      }
    }

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || null,
        companyName: user.company_name || user.companyName || null,
        vendorId: user.vendor_id || user.vendorId || null,
        avatar: user.avatar
      },
      token
    };

    localStorage.setItem('procure_session', JSON.stringify(session));
    return session;
  },

  registerVendor: async (formData) => {
    const cleanEmail = formData.email.toLowerCase().trim();

    // Check if email already registered in local storage or Supabase
    const storedUsersStr = localStorage.getItem('procure_users');
    let allUsers = INITIAL_USERS;
    if (storedUsersStr) {
      try {
        const parsed = JSON.parse(storedUsersStr);
        allUsers = [...INITIAL_USERS, ...parsed];
      } catch (err) {}
    }

    const existingLocalUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingLocalUser) {
      throw new Error('An account with this email address already exists. Please sign in or use a different email.');
    }

    try {
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail);
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('An account with this email address already exists. Please sign in or use a different email.');
      }
    } catch (e) {
      if (e.message && e.message.includes('already exists')) throw e;
    }

    const timestamp = Date.now();
    const vendorId = `vnd_reg_${timestamp}`;
    const userId = `usr_vnd_${timestamp}`;
    const vendorCode = `VND-REG-${Math.floor(100 + Math.random() * 900)}`;

    const userDbData = {
      id: userId,
      name: formData.name || formData.companyName,
      email: cleanEmail,
      password: formData.password,
      role: 'vendor',
      company_name: formData.companyName || formData.name,
      vendor_id: vendorId,
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=150&q=80'
    };

    const vendorDbData = {
      id: vendorId,
      user_id: userId,
      name: formData.companyName || formData.name,
      code: vendorCode,
      contact_person: formData.contactPerson,
      email: cleanEmail,
      phone: formData.phone,
      category: formData.category || 'Hardware & Raw Materials',
      status: 'Pending',
      score: 100.0,
      gstin: formData.gstin || '',
      pan: formData.pan || '',
      address: formData.address || '',
      joined_date: new Date().toISOString().split('T')[0]
    };

    // Attempt Supabase insert
    try {
      await supabase.from('users').insert(userDbData);
      await supabase.from('vendors').insert(vendorDbData);
    } catch (e) {
      console.warn('[Supabase] Registration fallback to local storage:', e);
    }

    // Always update local storage cache for immediate offline/mock compatibility
    try {
      const localUsers = storedUsersStr ? JSON.parse(storedUsersStr) : [];
      localUsers.push({
        id: userId,
        name: formData.name || formData.companyName,
        email: cleanEmail,
        password: formData.password,
        role: 'vendor',
        companyName: formData.companyName || formData.name,
        vendorId: vendorId,
        avatar: userDbData.avatar
      });
      localStorage.setItem('procure_users', JSON.stringify(localUsers));

      const storedVendorsStr = localStorage.getItem('procure_vendors');
      const localVendors = storedVendorsStr ? JSON.parse(storedVendorsStr) : [];
      localVendors.push({
        id: vendorId,
        userId: userId,
        name: formData.companyName || formData.name,
        code: vendorCode,
        contactPerson: formData.contactPerson,
        email: cleanEmail,
        phone: formData.phone,
        category: formData.category,
        status: 'Pending',
        score: 100,
        gstin: formData.gstin || '',
        pan: formData.pan || '',
        address: formData.address || '',
        joinedDate: vendorDbData.joined_date,
        documents: []
      });
      localStorage.setItem('procure_vendors', JSON.stringify(localVendors));
    } catch (e) {
      console.error('LocalStorage update error during vendor registration:', e);
    }

    return {
      success: true,
      message: 'Registration submitted successfully. Pending manager approval.',
      vendorId,
      userId
    };
  },

  getCurrentSession: async () => {
    const stored = localStorage.getItem('procure_session');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  updateUserProfile: async (userId, profileData) => {
    const updateData = {};
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.password !== undefined) updateData.password = profileData.password;
    if (profileData.department !== undefined) updateData.department = profileData.department;
    if (profileData.companyName !== undefined) updateData.company_name = profileData.companyName;
    if (profileData.avatar !== undefined) updateData.avatar = profileData.avatar;

    let updatedUserObj = null;

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('*');

      if (!error && data && data.length > 0) {
        updatedUserObj = data[0];
      }
    } catch (e) {
      console.warn('[Supabase] Profile update error:', e);
    }

    if (!updatedUserObj) {
      // Local storage fallback update
      const currentSessionStr = localStorage.getItem('procure_session');
      if (currentSessionStr) {
        try {
          const session = JSON.parse(currentSessionStr);
          updatedUserObj = {
            ...session.user,
            ...profileData,
            company_name: profileData.companyName || session.user.companyName
          };
        } catch (e) {}
      }
    }

    if (!updatedUserObj) {
      throw new Error('Failed to update profile');
    }

    // Update active session in localStorage
    const currentSessionStr = localStorage.getItem('procure_session');
    if (currentSessionStr) {
      try {
        const session = JSON.parse(currentSessionStr);
        if (session.user.id === userId) {
          session.user = {
            ...session.user,
            name: updatedUserObj.name || updatedUserObj.name,
            email: updatedUserObj.email,
            department: updatedUserObj.department,
            companyName: updatedUserObj.company_name || updatedUserObj.companyName,
            avatar: updatedUserObj.avatar
          };
          localStorage.setItem('procure_session', JSON.stringify(session));
        }
      } catch (e) {
        console.error('Session update error', e);
      }
    }

    return {
      id: updatedUserObj.id,
      name: updatedUserObj.name,
      email: updatedUserObj.email,
      role: updatedUserObj.role,
      department: updatedUserObj.department || null,
      companyName: updatedUserObj.company_name || updatedUserObj.companyName || null,
      vendorId: updatedUserObj.vendor_id || updatedUserObj.vendorId || null,
      avatar: updatedUserObj.avatar
    };
  },

  logout: async () => {
    localStorage.removeItem('procure_session');
    return true;
  }
};

