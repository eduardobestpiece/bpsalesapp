-- Add meeting stage columns to funnels table
ALTER TABLE funnels
ADD COLUMN meeting_scheduled_stage_id UUID REFERENCES funnel_stages(id),
ADD COLUMN meeting_completed_stage_id UUID REFERENCES funnel_stages(id);