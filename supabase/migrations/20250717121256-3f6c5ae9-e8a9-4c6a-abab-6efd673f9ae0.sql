-- Add comprehensive RAMS documents for all work types with correct risk levels
INSERT INTO public.rams_documents (title, version, work_types, risk_level, content, minimum_read_time, is_active)
VALUES
  -- Electrical Work
  ('Electrical Installation Safety Guide', 'v2.0', ARRAY['electrical-installation'], 'high', 
   'ELECTRICAL INSTALLATION SAFETY PROCEDURES

1. ISOLATION PROCEDURES
- Always isolate electrical supply before work
- Use approved lock-out/tag-out procedures
- Test isolation with approved voltage tester
- Assume all circuits are live until proven dead

2. PPE REQUIREMENTS
- Safety boots with electrical rating
- Insulated gloves for live work
- Safety glasses/goggles
- Hard hat with chin strap
- High-visibility clothing

3. TESTING REQUIREMENTS
- Test all installations before energizing
- Use calibrated test equipment
- Document all test results
- Obtain electrical certificate before handover

4. EMERGENCY PROCEDURES
- Know location of emergency isolation
- First aid procedures for electrical shock
- Emergency contact numbers displayed
- Resuscitation equipment available

REMEMBER: If in doubt, do not proceed. Seek supervision.', 15, true),

  ('Electrical Maintenance Safety Protocol', 'v1.8', ARRAY['electrical-maintenance'], 'high',
   'ELECTRICAL MAINTENANCE SAFETY PROTOCOL

1. PRE-WORK SAFETY CHECKS
- Verify isolation of electrical supply
- Check condition of tools and equipment
- Ensure adequate lighting in work area
- Confirm emergency procedures

2. MAINTENANCE PROCEDURES
- Follow manufacturer guidelines
- Use only approved replacement parts
- Document all work performed
- Test operation after maintenance

3. LIVE WORKING RESTRICTIONS
- Only authorized personnel may work live
- Risk assessment required for live work
- Additional PPE for live working
- Qualified person to supervise

4. COMPLETION REQUIREMENTS
- Functional testing of all systems
- Replace all guards and covers
- Update maintenance records
- Clean work area

WARNING: Electrical work can be fatal. Follow all procedures.', 12, true),

  ('Testing & Commissioning Safety Guide', 'v1.5', ARRAY['testing-commissioning'], 'medium',
   'TESTING & COMMISSIONING SAFETY PROCEDURES

1. PREPARATION PHASE
- Review all installation documentation
- Verify isolation procedures
- Check calibration of test equipment
- Ensure adequate workspace lighting

2. TESTING PROCEDURES
- Follow approved test sequences
- Document all test results
- Use appropriate measuring instruments
- Never exceed equipment ratings

3. COMMISSIONING REQUIREMENTS
- Systematic functional testing
- Load testing where applicable
- Performance verification
- Client witness testing

4. DOCUMENTATION
- Complete test certificates
- Update as-built drawings
- Provide operation manuals
- Schedule maintenance requirements

CAUTION: Ensure all safety systems are functional before handover.', 10, true),

  ('Sprinkler & Fire System Safety', 'v2.1', ARRAY['sprinkler-fire'], 'high',
   'SPRINKLER & FIRE SYSTEM SAFETY PROCEDURES

1. WATER SUPPLY ISOLATION
- Coordinate with site management
- Identify alternative fire protection
- Post fire watch personnel if required
- Notify fire brigade if necessary

2. SYSTEM WORK PROCEDURES
- Use only approved components
- Follow manufacturer specifications
- Pressure test all connections
- Flush system before commissioning

3. HOT WORK RESTRICTIONS
- Fire watch required during welding
- Remove combustible materials
- Have fire extinguisher ready
- Check area 2 hours after completion

4. SYSTEM RESTORATION
- Gradual system filling
- Check for leaks at all joints
- Test all alarm functions
- Update system documentation

CRITICAL: Fire safety systems protect lives. No shortcuts permitted.', 18, true),

  ('General Labour Safety Handbook', 'v1.9', ARRAY['general-labour'], 'medium',
   'GENERAL LABOUR SAFETY HANDBOOK

1. SITE INDUCTION REQUIREMENTS
- Complete site safety briefing
- Understand emergency procedures
- Know location of first aid facilities
- Familiarize with site layout

2. MANUAL HANDLING
- Assess load before lifting
- Use mechanical aids where possible
- Lift with legs, not back
- Get help for heavy items

3. TOOL SAFETY
- Inspect tools before use
- Use right tool for the job
- Keep tools clean and sharp
- Report defective tools immediately

4. HOUSEKEEPING
- Keep work areas clean and tidy
- Remove trip hazards immediately
- Dispose of waste properly
- Stack materials safely

REMEMBER: Your safety is your responsibility.', 8, true),

  ('Plumbing Installation Safety Guide', 'v1.7', ARRAY['plumbing'], 'medium',
   'PLUMBING INSTALLATION SAFETY PROCEDURES

1. WATER ISOLATION
- Locate and operate main stop valve
- Drain down systems where required
- Protect work area from water damage
- Have absorbent materials ready

2. PIPE WORK SAFETY
- Support all pipe work adequately
- Use correct jointing methods
- Pressure test all new installations
- Insulate pipes to prevent freezing

3. CONFINED SPACES
- Risk assessment for confined work
- Adequate ventilation required
- Emergency rescue procedures
- Communication systems in place

4. HYGIENE REQUIREMENTS
- Disinfect potable water systems
- Use only approved materials
- Prevent contamination during work
- Test water quality after completion

IMPORTANT: Protect public health through proper installation.', 12, true),

  ('Heating & Cooling System Safety', 'v2.0', ARRAY['heating-cooling'], 'high',
   'HEATING & COOLING SYSTEM SAFETY PROCEDURES

1. GAS SAFETY REQUIREMENTS
- Only gas safe registered engineers
- Gas tightness testing mandatory
- Ventilation requirements critical
- Emergency gas isolation procedures

2. REFRIGERANT HANDLING
- F-Gas certified operatives only
- Proper recovery procedures
- Leak detection requirements
- Environmental protection measures

3. ELECTRICAL CONNECTIONS
- Isolate electrical supply
- Follow wiring regulations
- Earth bonding requirements
- RCD protection essential

4. COMMISSIONING PROCEDURES
- System balancing required
- Performance testing
- Safety device operation checks
- Client handover documentation

WARNING: Gas and electrical hazards present. Competent persons only.', 16, true),

  ('Ventilation & AC Safety Protocol', 'v1.6', ARRAY['ventilation-ac'], 'medium',
   'VENTILATION & AC SAFETY PROTOCOL

1. ACCESS SAFETY
- Safe access to roof spaces
- Ladder safety procedures
- Fall protection equipment
- Adequate lighting required

2. DUCTWORK INSTALLATION
- Support systems adequate
- Fire stopping requirements
- Insulation safety procedures
- Sharp edge protection

3. SYSTEM BALANCING
- Airflow measurement procedures
- Filter installation requirements
- Control system commissioning
- Performance verification

4. MAINTENANCE ACCESS
- Ensure future access provisions
- Clear access routes
- Service platform requirements
- Emergency isolation access

CAUTION: Work at height and confined spaces present additional risks.', 11, true),

  ('Pipe Fitting Safety Procedures', 'v1.4', ARRAY['pipe-fitting'], 'medium',
   'PIPE FITTING SAFETY PROCEDURES

1. PREPARATION REQUIREMENTS
- Material compatibility checks
- Correct tools and equipment
- Adequate work lighting
- Clear access routes

2. CUTTING AND JOINING
- Eye protection mandatory
- Proper ventilation for adhesives
- Fire precautions for hot work
- Support pipe work during cutting

3. PRESSURE TESTING
- Gradual pressure application
- All personnel clear of test area
- Appropriate test pressures
- Document test results

4. SYSTEM INTEGRATION
- Coordinate with other trades
- Check for interference
- Maintain system integrity
- Update drawings as required

SAFETY FIRST: Proper preparation prevents poor performance.', 9, true),

  ('Insulation Work Safety Guide', 'v1.3', ARRAY['insulation'], 'low',
   'INSULATION WORK SAFETY GUIDE

1. MATERIAL SAFETY
- Check material safety data sheets
- Use appropriate PPE for materials
- Avoid skin and eye contact
- Ensure adequate ventilation

2. INSTALLATION PROCEDURES
- Cut materials safely
- Avoid compression of insulation
- Maintain vapor barriers
- Seal all penetrations

3. FIRE SAFETY
- Use fire-rated materials where required
- Maintain fire stopping integrity
- Keep ignition sources away
- Follow building regulations

4. HEALTH PROTECTION
- Respiratory protection
- Skin protection measures
- Eye protection essential
- Wash facilities available

PROTECT YOURSELF: Insulation materials can cause irritation.', 7, true),

  ('Tank & Plant Room Safety Procedures', 'v2.2', ARRAY['tank-plant-room'], 'high',
   'TANK & PLANT ROOM SAFETY PROCEDURES

1. CONFINED SPACE ENTRY
- Atmospheric testing required
- Entry permit system
- Emergency rescue arrangements
- Communication systems

2. LIFTING OPERATIONS
- Certified lifting equipment
- Competent appointed person
- Lifting plan for heavy items
- Exclusion zones established

3. CHEMICAL SAFETY
- Identify hazardous substances
- Appropriate PPE selection
- Emergency wash facilities
- Spill containment measures

4. MECHANICAL SAFETY
- Lock out/tag out procedures
- Moving parts protection
- Pressure system safety
- Temperature hazard controls

DANGER: Multiple hazards present. Follow all safety procedures.', 20, true),

  ('Mechanical Engineering Safety Protocol', 'v1.8', ARRAY['mechanical-engineering'], 'high',
   'MECHANICAL ENGINEERING SAFETY PROTOCOL

1. MACHINE SAFETY
- Guards and safety devices
- Emergency stop systems
- Lockout/tagout procedures
- Maintenance access safety

2. PRESSURE SYSTEMS
- Pressure testing procedures
- Relief valve settings
- Operating limits
- Inspection requirements

3. ROTATING EQUIPMENT
- Coupling guards essential
- Vibration monitoring
- Lubrication safety
- Belt guard requirements

4. INSTALLATION SAFETY
- Lifting plan required
- Foundation checks
- Alignment procedures
- Commissioning safety

CRITICAL: Mechanical systems have stored energy. Exercise extreme caution.', 14, true);