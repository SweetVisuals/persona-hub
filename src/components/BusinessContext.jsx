import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinessData = async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Fetch the business
      const { data: bData, error: bError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();
        
      if (bError) throw bError;
      setBusiness(bData);

      // Fetch personas
      await refetchPersonas();
      
    } catch (error) {
      console.error('Error fetching business context:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetchPersonas = async () => {
    if (!businessId) return;
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*, social_accounts(*)')
        .eq('business_id', businessId);
        
      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Error refetching personas:', error);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  return (
    <BusinessContext.Provider value={{ business, personas, loading, refetchPersonas }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
