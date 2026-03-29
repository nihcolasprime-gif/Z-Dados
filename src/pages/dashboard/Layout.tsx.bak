'use client';

import { Sidebar } from '../../components/Layout/Sidebar';
import { Topbar } from '../../components/Layout/Topbar';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../components/Layout/Layout.module.css';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const { profile, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Sidebar profile={profile} email={user?.email} />
      <main className={styles.mainContent}>
        <Topbar />
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
