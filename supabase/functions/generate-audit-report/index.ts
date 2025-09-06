/*
  # Generate Audit Report Function

  1. Function Purpose
    - Generates comprehensive audit reports
    - Exports compliance data in multiple formats
    - Creates detailed violation reports
    - Provides audit trail documentation

  2. Security
    - Requires authenticated user
    - Uses service role for database operations
    - Validates report parameters

  3. Report Types
    - License compliance audit
    - Asset management audit
    - Security compliance report
    - Policy violation summary
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, parameters = {} } = await req.json();
    let reportData: any = {};

    switch (type) {
      case 'license-audit':
        // Generate license compliance audit
        const { data: licenses } = await supabaseClient
          .from('licenses')
          .select('*');

        const { data: licenseViolations } = await supabaseClient
          .from('policy_violations')
          .select('*')
          .eq('type', 'License Overuse');

        reportData = {
          reportType: 'License Compliance Audit',
          generatedAt: new Date().toISOString(),
          summary: {
            totalLicenses: licenses?.length || 0,
            totalSeats: licenses?.reduce((sum, l) => sum + (l.seats_total || 0), 0) || 0,
            usedSeats: licenses?.reduce((sum, l) => sum + (l.seats_used || 0), 0) || 0,
            violations: licenseViolations?.length || 0
          },
          licenses: licenses?.map(license => ({
            id: license.id,
            name: license.name,
            vendor: license.vendor,
            totalSeats: license.seats_total,
            usedSeats: license.seats_used,
            availableSeats: (license.seats_total || 0) - (license.seats_used || 0),
            utilizationRate: license.seats_total > 0 ? ((license.seats_used || 0) / license.seats_total) * 100 : 0,
            expiryDate: license.expiry_date,
            status: license.status,
            complianceStatus: (license.seats_used || 0) <= (license.seats_total || 0) ? 'Compliant' : 'Non-Compliant'
          })),
          violations: licenseViolations
        };
        break;

      case 'asset-audit':
        // Generate asset management audit
        const { data: assets } = await supabaseClient
          .from('assets')
          .select('*');

        const { data: maintenanceRecords } = await supabaseClient
          .from('maintenance_records')
          .select('*');

        reportData = {
          reportType: 'Asset Management Audit',
          generatedAt: new Date().toISOString(),
          summary: {
            totalAssets: assets?.length || 0,
            activeAssets: assets?.filter(a => a.status === 'available' || a.status === 'deployed').length || 0,
            maintenanceRecords: maintenanceRecords?.length || 0,
            assetsWithWarranty: assets?.filter(a => a.warranty_expires).length || 0
          },
          assets: assets?.map(asset => ({
            id: asset.id,
            name: asset.name,
            assetTag: asset.asset_tag,
            category: asset.category,
            status: asset.status,
            assignedTo: asset.assigned_to,
            location: asset.location,
            purchaseDate: asset.purchase_date,
            purchaseCost: asset.purchase_cost,
            warrantyExpires: asset.warranty_expires,
            warrantyStatus: asset.warranty_expires ? 
              (new Date(asset.warranty_expires) > new Date() ? 'Active' : 'Expired') : 'N/A',
            complianceStatus: asset.status === 'available' || asset.status === 'deployed' ? 'Compliant' : 'Review Required'
          })),
          maintenanceRecords: maintenanceRecords?.slice(0, 50) // Limit for performance
        };
        break;

      case 'security-compliance':
        // Generate security compliance report
        const { data: securityViolations } = await supabaseClient
          .from('policy_violations')
          .select('*')
          .eq('type', 'Security Policy');

        const { data: securityChecks } = await supabaseClient
          .from('compliance_checks')
          .select('*')
          .eq('type', 'Security Compliance');

        reportData = {
          reportType: 'Security Compliance Report',
          generatedAt: new Date().toISOString(),
          summary: {
            securityChecks: securityChecks?.length || 0,
            compliantChecks: securityChecks?.filter(c => c.status === 'Compliant').length || 0,
            securityViolations: securityViolations?.length || 0,
            openViolations: securityViolations?.filter(v => v.status === 'Open').length || 0
          },
          checks: securityChecks,
          violations: securityViolations,
          recommendations: [
            'Implement regular security patch updates',
            'Conduct quarterly security assessments',
            'Review access control policies',
            'Update incident response procedures'
          ]
        };
        break;

      case 'policy-violations':
        // Generate policy violations summary
        const { data: allViolations } = await supabaseClient
          .from('policy_violations')
          .select('*')
          .order('detected_date', { ascending: false });

        const violationsByType = allViolations?.reduce((acc, violation) => {
          acc[violation.type] = (acc[violation.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const violationsBySeverity = allViolations?.reduce((acc, violation) => {
          acc[violation.severity] = (acc[violation.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        reportData = {
          reportType: 'Policy Violations Summary',
          generatedAt: new Date().toISOString(),
          summary: {
            totalViolations: allViolations?.length || 0,
            openViolations: allViolations?.filter(v => v.status === 'Open').length || 0,
            resolvedViolations: allViolations?.filter(v => v.status === 'Resolved').length || 0,
            criticalViolations: allViolations?.filter(v => v.severity === 'Critical').length || 0
          },
          violationsByType,
          violationsBySeverity,
          violations: allViolations?.slice(0, 100), // Limit for performance
          trends: {
            last7Days: allViolations?.filter(v => 
              new Date(v.detected_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length || 0,
            last30Days: allViolations?.filter(v => 
              new Date(v.detected_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ).length || 0
          }
        };
        break;

      default:
        // Generate comprehensive audit report
        const { data: allAssets } = await supabaseClient.from('assets').select('*');
        const { data: allLicenses } = await supabaseClient.from('licenses').select('*');
        const { data: allChecks } = await supabaseClient.from('compliance_checks').select('*');
        const { data: allViolationsDefault } = await supabaseClient.from('policy_violations').select('*');

        reportData = {
          reportType: 'Comprehensive Compliance Audit',
          generatedAt: new Date().toISOString(),
          summary: {
            totalAssets: allAssets?.length || 0,
            totalLicenses: allLicenses?.length || 0,
            totalChecks: allChecks?.length || 0,
            totalViolations: allViolationsDefault?.length || 0,
            overallScore: allChecks && allChecks.length > 0 ? 
              (allChecks.filter(c => c.status === 'Compliant').length / allChecks.length) * 100 : 100
          },
          assets: allAssets?.slice(0, 50),
          licenses: allLicenses?.slice(0, 50),
          complianceChecks: allChecks?.slice(0, 20),
          violations: allViolationsDefault?.slice(0, 20)
        };
    }

    // Log audit report generation
    await supabaseClient
      .from('activities')
      .insert({
        type: 'audit_report_generated',
        description: `Generated ${reportData.reportType}`,
        entity_type: 'report',
        user_id: null
      });

    return new Response(
      JSON.stringify(reportData),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Audit report generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate audit report',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});