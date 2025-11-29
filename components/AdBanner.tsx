import { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Linking, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/colors';

interface AdBannerProps {
  position: 'home_top' | 'home_middle' | 'feed' | 'profile' | 'marketplace';
  type?: 'banner' | 'native';
}

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  type: string;
}

export default function AdBanner({ position, type = 'banner' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [position]);

  const fetchAd = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('position', position)
        .eq('type', type)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAd(data);
        setVisible(true);
        await supabase.rpc('increment_ad_view_count', { ad_uuid: data.id });
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    }
  };

  const handleAdClick = async () => {
    if (!ad) return;

    try {
      await supabase.from('ad_clicks').insert({
        ad_id: ad.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      const { data: adData } = await supabase
        .from('advertisements')
        .select('click_count')
        .eq('id', ad.id)
        .single();

      if (adData) {
        await supabase
          .from('advertisements')
          .update({ click_count: (adData.click_count || 0) + 1 })
          .eq('id', ad.id);
      }

      if (ad.link_url) {
        await Linking.openURL(ad.link_url);
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  if (!visible || !ad) return null;

  const windowWidth = Dimensions.get('window').width;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        type === 'banner' ? styles.bannerContainer : styles.nativeContainer,
      ]}
      onPress={handleAdClick}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: ad.image_url }}
        style={[
          styles.image,
          type === 'banner'
            ? { width: windowWidth - 24, height: (windowWidth - 24) * 0.25 }
            : { width: '100%', height: 200 },
        ]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  bannerContainer: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.secondary[100],
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  nativeContainer: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.secondary[100],
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  image: {
    borderRadius: 12,
  },
});
