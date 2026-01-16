import { useState } from "react";
import { Mail, User, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Contact {
  id: string;
  name: string;
  email: string;
}

interface EmergencyContactProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onRemoveContact: (id: string) => void;
  onUpdateContact: (id: string, contact: Omit<Contact, 'id'>) => void;
}

export function EmergencyContact({ contacts, onAddContact, onRemoveContact, onUpdateContact }: EmergencyContactProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = () => {
    if (newName && newEmail) {
      onAddContact({ name: newName, email: newEmail });
      setNewName('');
      setNewEmail('');
      setIsAdding(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (newName && newEmail) {
      onUpdateContact(id, { name: newName, email: newEmail });
      setEditingId(null);
      setNewName('');
      setNewEmail('');
    }
  };

  const startEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setNewName(contact.name);
    setNewEmail(contact.email);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName('');
    setNewEmail('');
    setIsAdding(false);
  };

  return (
    <div className="status-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">紧急联系人</h3>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            添加
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        如果您连续 48 小时未签到，系统将自动通知以下联系人
      </p>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {editingId === contact.id ? (
              <>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="姓名"
                    className="flex-1"
                  />
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="邮箱"
                    className="flex-1"
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleUpdate(contact.id)}>
                  <Check className="w-4 h-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{contact.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => startEdit(contact)}>
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onRemoveContact(contact.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="姓名"
                className="flex-1"
              />
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="邮箱"
                className="flex-1"
              />
            </div>
            <Button size="icon" variant="ghost" onClick={handleAdd}>
              <Check className="w-4 h-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" onClick={cancelEdit}>
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        )}

        {contacts.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>还没有添加紧急联系人</p>
          </div>
        )}
      </div>
    </div>
  );
}
