import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_template: boolean;
  display_order: number;
  job_types_count?: number;
}

export const WorkCategoryManager: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WorkCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    display_order: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('work_categories')
        .select(`
          id,
          main_category,
          sub_task,
          created_at,
          updated_at
        `)
        .order('main_category');

      if (error) throw error;

      // Mock data since job_types doesn't exist
      const categoriesWithCount = data?.map(cat => ({
        id: cat.id,
        name: cat.main_category,
        code: cat.main_category.substring(0, 3).toUpperCase(),
        description: cat.sub_task,
        is_template: true,
        display_order: 1,
        job_types_count: 0
      })) || [];

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load work categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const categoryData = {
        main_category: formData.name || 'Default Category',
        sub_task: formData.description || 'Default Task'
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('work_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({ title: "Success", description: "Work category updated successfully" });
      } else {
        const { error } = await supabase
          .from('work_categories')
          .insert(categoryData);

        if (error) throw error;
        toast({ title: "Success", description: "Work category created successfully" });
      }

      // Reset form
      setFormData({ name: '', code: '', description: '', display_order: 0 });
      setShowAddForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save work category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Work Category Management</h2>
          <p className="text-muted-foreground">
            Manage work categories and job types for projects
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingCategory) && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Category Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                  setFormData({ name: '', code: '', description: '', display_order: 0 });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.map(category => (
          <Card key={category.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">Code: {category.code}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  {category.job_types_count || 0} Job Types
                </Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(category);
                      setFormData({
                        name: category.name,
                        code: category.code,
                        description: category.description || '',
                        display_order: category.display_order
                      });
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Work Categories</h3>
          <p className="text-muted-foreground">
            Create your first work category to start organizing job types.
          </p>
        </Card>
      )}
    </div>
  );
};