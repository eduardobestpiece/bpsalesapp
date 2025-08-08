
import { useEffect, useMemo, useRef, useState } from 'react';
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsLeyout() {
  // página substituída por SettingsEmpresa
  return null;
}
