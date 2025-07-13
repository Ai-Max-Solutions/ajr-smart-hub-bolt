import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Users, Download, Edit, Copy, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InductionSection {
  id: string;
  title: string;
  content: string;
  attachments?: File[];
  required: boolean;
}

interface InductionTemplate {
  id: string;
  title: string;
  project: string;
  sections: InductionSection[];
  version: string;
  createdBy: string;
  createdDate: Date;
  requiresSignature: boolean;
  assignedOperatives: string[];
  completionRate: number;
  status: 'draft' | 'active' | 'archived';
}

const InductionBuilder = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<InductionTemplate | null>(null);
  const [newSection, setNewSection] = useState<Partial<InductionSection>>({
    title: '',
    content: '',
    required: true
  });

  // Mock data - replace with actual data fetching
  const [templates, setTemplates] = useState<InductionTemplate[]>([
    {
      id: '1',
      title: 'Woodberry Down Phase 2 - Site Induction v1.2',
      project: 'Woodberry Down Phase 2',
      sections: [
        { id: '1', title: 'Site Rules & Access', content: 'All operatives must...', required: true },
        { id: '2', title: 'Emergency Procedures', content: 'In case of emergency...', required: true },
        { id: '3', title: 'PPE Requirements', content: 'Required PPE includes...', required: true },
        { id: '4', title: 'Welfare Facilities', content: 'Welfare facilities are located...', required: false }
      ],
      version: '1.2',
      createdBy: 'John Smith',
      createdDate: new Date(),
      requiresSignature: true,
      assignedOperatives: ['operative1', 'operative2', 'operative3'],
      completionRate: 75,
      status: 'active'
    },
    {
      id: '2',
      title: 'Kidbrooke Village Block C Induction v2.0',
      project: 'Kidbrooke Village',
      sections: [
        { id: '1', title: 'Site Overview', content: 'Project overview...', required: true },
        { id: '2', title: 'Asbestos Areas', content: 'Known asbestos locations...', required: true }
      ],
      version: '2.0',
      createdBy: 'Sarah Johnson',
      createdDate: new Date(),
      requiresSignature: true,
      assignedOperatives: ['operative4', 'operative5'],
      completionRate: 50,
      status: 'active'
    }
  ]);

  const handleCreateTemplate = () => {
    setEditingTemplate({
      id: '',
      title: '',
      project: '',
      sections: [],
      version: '1.0',
      createdBy: 'Current User',
      createdDate: new Date(),
      requiresSignature: true,
      assignedOperatives: [],
      completionRate: 0,
      status: 'draft'
    });
    setActiveTab('builder');
  };

  const handleCloneTemplate = (template: InductionTemplate) => {
    const cloned = {
      ...template,
      id: '',
      title: `${template.title} (Copy)`,
      version: '1.0',
      createdDate: new Date(),
      status: 'draft' as const,
      completionRate: 0,
      assignedOperatives: []
    };
    setEditingTemplate(cloned);
    setActiveTab('builder');
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    if (editingTemplate.id) {
      // Update existing
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    } else {
      // Create new
      const newTemplate = {
        ...editingTemplate,
        id: Date.now().toString()
      };
      setTemplates(prev => [...prev, newTemplate]);
    }

    toast({
      title: "Induction Saved",
      description: "Induction template has been saved successfully."
    });

    setEditingTemplate(null);
    setActiveTab('templates');
  };

  const handleAddSection = () => {
    if (!editingTemplate || !newSection.title || !newSection.content) return;

    const section: InductionSection = {
      id: Date.now().toString(),
      title: newSection.title,
      content: newSection.content,
      required: newSection.required || true
    };

    setEditingTemplate({
      ...editingTemplate,
      sections: [...editingTemplate.sections, section]
    });

    setNewSection({ title: '', content: '', required: true });
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      sections: editingTemplate.sections.filter(s => s.id !== sectionId)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Induction Builder</h1>
          <p className="text-muted-foreground">Create and manage site-specific induction templates</p>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Induction
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {template.title}
                        <Badge className={getStatusColor(template.status)}>
                          {template.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Version {template.version} • {template.sections.length} sections • 
                        Created by {template.createdBy}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCloneTemplate(template)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditingTemplate(template); setActiveTab('builder'); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Project</Label>
                      <p className="text-sm text-muted-foreground">{template.project}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned Operatives</Label>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{template.assignedOperatives.length}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Completion Rate</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${template.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{template.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          {editingTemplate ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Induction Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Induction Title</Label>
                      <Input
                        id="title"
                        value={editingTemplate.title}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          title: e.target.value
                        })}
                        placeholder="Site Induction Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">Project</Label>
                      <Select 
                        value={editingTemplate.project}
                        onValueChange={(value) => setEditingTemplate({
                          ...editingTemplate,
                          project: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Woodberry Down Phase 2">Woodberry Down Phase 2</SelectItem>
                          <SelectItem value="Kidbrooke Village">Kidbrooke Village</SelectItem>
                          <SelectItem value="Brentford Lock">Brentford Lock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="signature"
                      checked={editingTemplate.requiresSignature}
                      onCheckedChange={(checked) => setEditingTemplate({
                        ...editingTemplate,
                        requiresSignature: checked
                      })}
                    />
                    <Label htmlFor="signature">Require Digital Signature</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Induction Sections</CardTitle>
                  <CardDescription>Add sections for site rules, procedures, and requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingTemplate.sections.map((section) => (
                    <div key={section.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{section.title}</span>
                          {section.required && <Badge variant="secondary">Required</Badge>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{section.content}</p>
                    </div>
                  ))}

                  <div className="border-2 border-dashed border-border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Add New Section</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="section-title">Section Title</Label>
                        <Input
                          id="section-title"
                          value={newSection.title || ''}
                          onChange={(e) => setNewSection({
                            ...newSection,
                            title: e.target.value
                          })}
                          placeholder="e.g., Site Rules & Access"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Switch
                            checked={newSection.required || true}
                            onCheckedChange={(checked) => setNewSection({
                              ...newSection,
                              required: checked
                            })}
                          />
                          Required Section
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section-content">Content</Label>
                      <Textarea
                        id="section-content"
                        value={newSection.content || ''}
                        onChange={(e) => setNewSection({
                          ...newSection,
                          content: e.target.value
                        })}
                        placeholder="Section content and instructions..."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Add Attachment
                      </Button>
                      <Button onClick={handleAddSection} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  Save Induction
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium">No Induction Selected</h3>
                    <p className="text-muted-foreground">Select an induction to edit or create a new one</p>
                  </div>
                  <Button onClick={handleCreateTemplate}>
                    Create New Induction
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Templates</CardDescription>
                <CardTitle className="text-3xl">{templates.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Inductions</CardDescription>
                <CardTitle className="text-3xl">
                  {templates.filter(t => t.status === 'active').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Completion</CardDescription>
                <CardTitle className="text-3xl">
                  {Math.round(templates.reduce((acc, t) => acc + t.completionRate, 0) / templates.length)}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InductionBuilder;