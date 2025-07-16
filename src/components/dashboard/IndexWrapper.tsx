import Index from '@/pages/Index';

export const IndexWrapper = () => {
  console.info('[IndexWrapper] Rendering dashboard - loader passed all checks');
  
  // Loader guarantees user is authenticated and ready for dashboard
  // No need for additional async checks here
  return <Index />;
};