import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import CollaborationHub from '@/components/collaboration/CollaborationHub';
import { AuthProvider } from '@/hooks/useAuth';

const Collaboration = () => {
  return (
    <AuthProvider>
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Team Collaboration"
          description="Real-time chat, notifications, and team presence"
        />
        <CollaborationHub />
      </div>
    </AuthProvider>
  );
};

export default Collaboration;