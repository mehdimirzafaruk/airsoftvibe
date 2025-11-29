import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { colors, typographyColors } from '@/lib/colors';
import { AlertTriangle, Users, FileText, Calendar, Trash2, X } from 'lucide-react-native';

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  post: {
    id: string;
    content: string;
    user: {
      username: string;
    };
  };
  reporter: {
    username: string;
  };
}

export default function AdminScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'events'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (user?.profile?.role !== 'admin' && user?.profile?.role !== 'moderator') {
      return;
    }
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('post_reports')
        .select(`
          *,
          post:posts!post_reports_post_id_fkey(
            id,
            content,
            user:profiles!posts_user_id_fkey(username)
          ),
          reporter:profiles!post_reports_reported_by_fkey(username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    try {
      await supabase.from('posts').delete().eq('id', postId);

      await supabase
        .from('post_reports')
        .update({ status: 'reviewed', admin_notes: adminNotes })
        .eq('id', reportId);

      await supabase.from('admin_actions').insert({
        admin_id: user?.id,
        action: 'delete_post',
        target_type: 'post',
        target_id: postId,
        reason: adminNotes || 'Gönderi rapor sonucu silindi',
      });

      setActionModalVisible(false);
      fetchReports();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await supabase
        .from('post_reports')
        .update({ status: 'dismissed', admin_notes: adminNotes })
        .eq('id', reportId);

      setActionModalVisible(false);
      fetchReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        setSelectedReport(item);
        setActionModalVisible(true);
      }}
    >
      <View style={styles.reportHeader}>
        <AlertTriangle color={colors.status.warning} size={20} />
        <Text style={styles.reportDate}>
          {new Date(item.created_at).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      <Text style={styles.reportReason}>Sebep: {item.reason}</Text>

      <View style={styles.reportDetails}>
        <Text style={styles.reportLabel}>Raporlayan:</Text>
        <Text style={styles.reportValue}>@{item.reporter.username}</Text>
      </View>

      <View style={styles.reportDetails}>
        <Text style={styles.reportLabel}>Gönderi Sahibi:</Text>
        <Text style={styles.reportValue}>@{item.post.user.username}</Text>
      </View>

      <View style={styles.postPreview}>
        <Text style={styles.postPreviewText} numberOfLines={2}>
          {item.post.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (user?.profile?.role !== 'admin' && user?.profile?.role !== 'moderator') {
    return (
      <View style={styles.container}>
        <View style={styles.noAccessContainer}>
          <AlertTriangle color={colors.status.error} size={48} />
          <Text style={styles.noAccessText}>Bu sayfaya erişim yetkiniz yok</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Paneli</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
            <FileText
              color={activeTab === 'reports' ? colors.neutral[0] : colors.neutral[400]}
              size={20}
            />
            <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
              Raporlar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Users
              color={activeTab === 'users' ? colors.neutral[0] : colors.neutral[400]}
              size={20}
            />
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Kullanıcılar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Calendar
              color={activeTab === 'events' ? colors.neutral[0] : colors.neutral[400]}
              size={20}
            />
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Etkinlikler
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'reports' && (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bekleyen rapor yok</Text>
            </View>
          }
        />
      )}

      {activeTab === 'users' && (
        <View style={styles.tabContent}>
          <Text style={styles.comingSoonText}>Kullanıcı yönetimi yakında...</Text>
        </View>
      )}

      {activeTab === 'events' && (
        <View style={styles.tabContent}>
          <Text style={styles.comingSoonText}>Etkinlik yönetimi yakında...</Text>
        </View>
      )}

      <Modal
        visible={actionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rapor İnceleme</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.neutral[400]} size={24} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Rapor Sebebi</Text>
                  <Text style={styles.modalValue}>{selectedReport.reason}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Raporlayan</Text>
                  <Text style={styles.modalValue}>@{selectedReport.reporter.username}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Gönderi Sahibi</Text>
                  <Text style={styles.modalValue}>@{selectedReport.post.user.username}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Gönderi İçeriği</Text>
                  <View style={styles.postContent}>
                    <Text style={styles.postContentText}>{selectedReport.post.content}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Admin Notları</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="İsteğe bağlı not ekleyin"
                    placeholderTextColor={colors.neutral[500]}
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    multiline
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => handleDismissReport(selectedReport.id)}
                  >
                    <Text style={styles.dismissButtonText}>Reddet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePost(selectedReport.post.id, selectedReport.id)}
                  >
                    <Trash2 color={colors.neutral[0]} size={18} />
                    <Text style={styles.deleteButtonText}>Gönderiyi Sil</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  header: {
    backgroundColor: colors.secondary[100],
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent[600],
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
  },
  activeTab: {
    backgroundColor: colors.accent[600],
  },
  tabText: {
    color: colors.neutral[400],
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.neutral[0],
  },
  listContent: {
    paddingVertical: 8,
  },
  reportCard: {
    backgroundColor: colors.secondary[100],
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reportDate: {
    color: typographyColors.tertiary,
    fontSize: 12,
  },
  reportReason: {
    color: typographyColors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reportDetails: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reportLabel: {
    color: typographyColors.tertiary,
    fontSize: 14,
    marginRight: 8,
  },
  reportValue: {
    color: typographyColors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  postPreview: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  postPreviewText: {
    color: typographyColors.secondary,
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    color: typographyColors.tertiary,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: typographyColors.tertiary,
    fontSize: 16,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noAccessText: {
    color: typographyColors.secondary,
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary[100],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: typographyColors.primary,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    color: typographyColors.tertiary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalValue: {
    color: typographyColors.primary,
    fontSize: 16,
  },
  postContent: {
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    padding: 12,
  },
  postContentText: {
    color: typographyColors.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  notesInput: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 8,
    padding: 12,
    color: typographyColors.primary,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[400],
  },
  dismissButtonText: {
    color: colors.neutral[400],
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.status.error,
  },
  deleteButtonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
});
