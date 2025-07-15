-- Insert sample RAMS documents after tables are created
INSERT INTO public.rams_documents (title, version, work_types, risk_level, content, minimum_read_time, requires_fresh_signature) VALUES
(
  'High Voltage Maintenance Safety Plan',
  '2.1',
  '{testing,maintenance,fault-finding}',
  'very_high',
  'HIGH VOLTAGE MAINTENANCE PLAN

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-HV-001
Version: 2.1
Effective Date: Jan 15, 2024

VERY HIGH RISK ACTIVITY
This document requires careful review

SCOPE OF WORK
This document covers the safety procedures for high voltage electrical maintenance work including:
- Isolation procedures
- Testing protocols
- Personal protective equipment requirements
- Emergency procedures

HAZARDS IDENTIFIED
• Electric shock/electrocution
• Arc flash/blast
• Burns from hot surfaces
• Falls from height
• Manual handling injuries

CONTROL MEASURES
1. All work must be carried out by competent persons
2. Proper isolation and lock-out procedures must be followed
3. Appropriate PPE must be worn at all times
4. Work area must be secured and signed
5. Emergency procedures must be understood by all personnel

By signing this document, you confirm that you have read, understood, and will comply with all safety procedures outlined above.',
  60,
  true
),
(
  'Electrical Installation Safety Guidelines',
  '3.0',
  '{installations,first-fix,second-fix}',
  'high',
  'ELECTRICAL INSTALLATION SAFETY GUIDELINES

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-EI-001
Version: 3.0

SCOPE OF WORK
Safety procedures for electrical installation work including first and second fix activities.

HAZARDS IDENTIFIED
• Electric shock
• Manual handling
• Working at height
• Tool-related injuries

CONTROL MEASURES
1. Always isolate circuits before work
2. Use appropriate PPE
3. Follow safe working practices
4. Regular tool inspection

By signing this document, you confirm understanding of all safety requirements.',
  45,
  false
),
(
  'Fire Alarm System Safety Procedures',
  '3.1',
  '{fire-alarms,testing}',
  'high',
  'FIRE ALARM SYSTEM SAFETY PROCEDURES

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-FA-001
Version: 3.1

SCOPE OF WORK
Safety procedures for fire alarm system installation, testing, and maintenance.

HAZARDS IDENTIFIED
• Electrical hazards
• Working at height
• Noise exposure during testing
• Manual handling

CONTROL MEASURES
1. Coordinate with building management
2. Use hearing protection during alarm testing
3. Follow height safety procedures
4. Proper isolation procedures

By signing this document, you confirm understanding of fire alarm safety requirements.',
  40,
  false
);