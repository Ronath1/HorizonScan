import { ScanResponseData } from '@/types/pestle';

export const MOCK_PRESETS: Record<string, ScanResponseData> = {
  'renewable energy_germany': {
    industry: 'Renewable Energy',
    target_country: 'Germany',
    timestamp: new Date().toISOString(),
    summary:
      'Germany’s renewable energy landscape is fueled by ambitious net-zero mandates and robust feed-in tariff expansions, creating unprecedented capital opportunity. However, significant transmission grid bottlenecks between the windy North and industrial South alongside complex municipal permitting pose tangible execution risks.',
    overall_sentiment_score: 2.8,
    cached: false,
    model_used: 'gemini-2.0-flash (Simulated Intelligence)',
    tavily_query:
      'Renewable Energy Germany (policy OR market economy OR consumer trends OR tech innovation OR regulation OR climate environmental laws)',
    sources: [
      {
        title: 'Germany Renewable Energy Act (EEG 2023) Overhaul and Targets',
        url: 'https://www.bmwk.de/Redaktion/EN/Dossier/renewable-energy.html',
        content:
          'The Federal Ministry for Economic Affairs and Climate Action set a target of 80% renewable electricity by 2030, designating renewable expansion as an overriding public interest.',
        published_date: '2024-03-12',
        score: 0.94,
      },
      {
        title: 'BNetzA Grid Expansion Report: North-South Transmission Deficit',
        url: 'https://www.bundesnetzagentur.de/EN/Areas/Energy/Companies/GridExpansion/gridexpansion_node.html',
        content:
          'Redispatch costs surged as offshore wind in Lower Saxony faced curtailment due to delayed HVDC corridor completions including SuedLink and SuedOstLink.',
        published_date: '2024-06-20',
        score: 0.91,
      },
      {
        title: 'BDI German Industry Power Price Competitiveness Index',
        url: 'https://bdi.eu/en/topic/energy-and-climate',
        content:
          'Industrial power purchase agreements (PPAs) are skyrocketing among Mittelstand manufacturers seeking price stability against volatile wholesale gas peaks.',
        published_date: '2024-05-18',
        score: 0.88,
      },
      {
        title: 'Fraunhofer ISE: German Battery Energy Storage Systems (BESS) Tripled',
        url: 'https://www.ise.fraunhofer.de/en/press-media/press-releases/2024/battery-storage-germany.html',
        content:
          'Utility-scale BESS deployment accelerated sharply in 2024 with grid-forming inverters and multi-hour arbitrage strategies reducing localized volatility.',
        published_date: '2024-07-04',
        score: 0.86,
      },
      {
        title: 'Federal Administrative Court: Accelerated Environmental Permitting Ruling',
        url: 'https://www.bverwg.de/en/decisions',
        content:
          'New environmental impact rules limit legal challenge durations against onshore wind farms, accelerating the average planning cycle from 6 years to 2.5 years.',
        published_date: '2024-04-11',
        score: 0.82,
      },
    ],
    pestle_breakdown: {
      political: [
        {
          id: 'pol_1',
          title: 'Federal 80% Renewable Electricity by 2030 Mandate',
          detail: 'National policy legally enshrines renewable infrastructure as an overriding public interest, streamlining federal approvals and subsidy releases.',
          type: 'Opportunity',
          impact_score: 4,
          source_url: 'https://www.bmwk.de/Redaktion/EN/Dossier/renewable-energy.html',
        },
        {
          id: 'pol_2',
          title: 'Regional Coalitions Divergence on Wind Land Quotas',
          detail: 'Southern federal states like Bavaria continue to face local political pushback regarding minimum distance rules (10H rules) for onshore wind developments.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.bmwk.de/Redaktion/EN/Dossier/renewable-energy.html',
        },
      ],
      economic: [
        {
          id: 'eco_1',
          title: 'Surge in Corporate PPA Demand from Mittelstand',
          detail: 'German heavy manufacturing sectors are eagerly signing 10-15 year Power Purchase Agreements to hedge against long-term natural gas price volatility.',
          type: 'Opportunity',
          impact_score: 4,
          source_url: 'https://bdi.eu/en/topic/energy-and-climate',
        },
        {
          id: 'eco_2',
          title: 'Escalating Redispatch Costs & Grid Congestion Tariffs',
          detail: 'Curtailment compensation costs paid to wind operators are levied onto grid tariffs, creating localized price disparities and balancing charges.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.bundesnetzagentur.de/EN/Areas/Energy/Companies/GridExpansion/gridexpansion_node.html',
        },
      ],
      social: [
        {
          id: 'soc_1',
          title: 'Strong Citizen Energy Cooperatives (Bürgerenergie)',
          detail: 'Community-owned solar and wind parks receive immense local endorsement, reducing NIMBY friction and accelerating municipal land leases.',
          type: 'Opportunity',
          impact_score: 3,
          source_url: 'https://www.bmwk.de/Redaktion/EN/Dossier/renewable-energy.html',
        },
        {
          id: 'soc_2',
          title: 'Rising Consumer Sensitivity to Energy Surcharge Allocations',
          detail: 'Voter discontent regarding residential heating transition legislation (Gebäudeenergiegesetz) creates sensitivity around renewable levy pass-throughs.',
          type: 'Risk',
          impact_score: -2,
          source_url: 'https://bdi.eu/en/topic/energy-and-climate',
        },
      ],
      technological: [
        {
          id: 'tech_1',
          title: 'Tripling of Utility Battery Storage (BESS) Installations',
          detail: 'Grid-forming inverters and high-density LFP storage farms are resolving solar peak duck-curve challenges and participating in wholesale arbitrage.',
          type: 'Opportunity',
          impact_score: 5,
          source_url: 'https://www.ise.fraunhofer.de/en/press-media/press-releases/2024/battery-storage-germany.html',
        },
        {
          id: 'tech_2',
          title: 'Transmission Corridor Delays for HVDC SuedLink',
          detail: 'Physical cable laying and converter station commissioning for north-south links lag 2-3 years behind renewable capacity additions.',
          type: 'Risk',
          impact_score: -4,
          source_url: 'https://www.bundesnetzagentur.de/EN/Areas/Energy/Companies/GridExpansion/gridexpansion_node.html',
        },
      ],
      legal: [
        {
          id: 'leg_1',
          title: 'Accelerated Administrative Judicial Procedures for Clean Tech',
          detail: 'Federal courts have compressed injunction periods and judicial review windows for clean energy projects under overriding public interest doctrine.',
          type: 'Opportunity',
          impact_score: 3,
          source_url: 'https://www.bverwg.de/en/decisions',
        },
        {
          id: 'leg_2',
          title: 'Complex EU Cross-Border Carbon Border & State Aid Scrutiny',
          detail: 'German state hydrogen and battery subsidy schemes face detailed European Commission antitrust scrutiny to ensure non-distortion of the single market.',
          type: 'Risk',
          impact_score: -2,
          source_url: 'https://www.bmwk.de/Redaktion/EN/Dossier/renewable-energy.html',
        },
      ],
      environmental: [
        {
          id: 'env_1',
          title: 'Binding Federal Climate Protection Act Targets',
          detail: 'Legally binding target of greenhouse gas neutrality by 2045 guarantees long-term institutional capital deployment and carbon market support.',
          type: 'Opportunity',
          impact_score: 5,
          source_url: 'https://www.bmwk.de/Redaktion/EN/Dossier/renewable-energy.html',
        },
        {
          id: 'env_2',
          title: 'Biodiversity & Avian Protection Zoning Restrictions',
          detail: 'Stricter red kite and bat conservation criteria continue to restrict permissible rotor swept areas in densely forested central uplands.',
          type: 'Risk',
          impact_score: -2,
          source_url: 'https://www.bverwg.de/en/decisions',
        },
      ],
    },
  },
  'fintech_india': {
    industry: 'Fintech',
    target_country: 'India',
    timestamp: new Date().toISOString(),
    summary:
      'India’s fintech ecosystem continues to be world-leading in digital transaction velocity driven by the UPI stack and expanding credit penetration. However, tightened Reserve Bank of India (RBI) prudential guidelines on unsecured lending and NBFC co-lending require strict regulatory vigilance.',
    overall_sentiment_score: 3.2,
    cached: false,
    model_used: 'gemini-2.0-flash (Simulated Intelligence)',
    tavily_query:
      'Fintech India (policy OR market economy OR consumer trends OR tech innovation OR regulation OR climate environmental laws)',
    sources: [
      {
        title: 'Reserve Bank of India (RBI) Master Direction on Digital Lending',
        url: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
        content:
          'RBI mandated strict algorithmic transparency, direct disbursement into borrower bank accounts without pass-through synthetic pools, and data localization.',
        published_date: '2024-02-15',
        score: 0.95,
      },
      {
        title: 'NPCI UPI Global Expansion and Credit Line on UPI Adoption',
        url: 'https://www.npci.org.in/what-we-do/upi/product-overview',
        content:
          'Unified Payments Interface clocked over 14 billion monthly transactions, with pre-sanctioned credit lines on UPI transforming micro-credit retail distribution.',
        published_date: '2024-06-10',
        score: 0.93,
      },
      {
        title: 'NITI Aayog FinTech Landscape & Financial Inclusion 2024',
        url: 'https://www.niti.gov.in/verticals/finance-and-financial-inclusion',
        content:
          'Tier 2 and Tier 3 digital penetration grew 42% year-over-year, supported by account aggregator networks unlocking cashflow-based lending for MSMEs.',
        published_date: '2024-05-22',
        score: 0.89,
      },
    ],
    pestle_breakdown: {
      political: [
        {
          id: 'fin_pol_1',
          title: 'State Backing for India Stack & Cross-Border UPI Bilaterals',
          detail: 'Government agreements with Singapore (PayNow), UAE, and France expand Indian fintech payment rails into international remittance corridors.',
          type: 'Opportunity',
          impact_score: 4,
          source_url: 'https://www.npci.org.in/what-we-do/upi/product-overview',
        },
        {
          id: 'fin_pol_2',
          title: 'Scrutiny on Foreign Shareholding and Ultimate Beneficial Ownership',
          detail: 'Regulatory review of cross-border payment aggregators linked to overseas venture capital funds introduces compliance friction.',
          type: 'Risk',
          impact_score: -2,
          source_url: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
        },
      ],
      economic: [
        {
          id: 'fin_eco_1',
          title: 'Micro-Credit Democratization via Pre-Sanctioned UPI Lines',
          detail: 'Enabling credit lines on UPI allows fintechs to monetize high-frequency transactions with lucrative interchange and short-tenor interest yields.',
          type: 'Opportunity',
          impact_score: 5,
          source_url: 'https://www.npci.org.in/what-we-do/upi/product-overview',
        },
        {
          id: 'fin_eco_2',
          title: 'RBI Risk Weight Hike on Unsecured Consumer Credit',
          detail: 'Higher capital adequacy requirements imposed on commercial banks and NBFC partners compressed fintech co-lending margins by 150-200 bps.',
          type: 'Risk',
          impact_score: -4,
          source_url: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
        },
      ],
      social: [
        {
          id: 'fin_soc_1',
          title: 'Rapid Digital Financial Adoption Across Tier-2/3 Cities',
          detail: 'Vernacular voice interfaces and biometric authentication triggered explosive adoption among 250M first-time smartphone consumers.',
          type: 'Opportunity',
          impact_score: 4,
          source_url: 'https://www.niti.gov.in/verticals/finance-and-financial-inclusion',
        },
        {
          id: 'fin_soc_2',
          title: 'Consumer Vulnerability to Fraud & Illegal Lending Apps',
          detail: 'Public outcry over aggressive loan recovery agents resulted in stringent police enforcement and platform delistings on Google Play Store.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
        },
      ],
      technological: [
        {
          id: 'fin_tech_1',
          title: 'Account Aggregator (AA) Ecosystem Reaching Critical Mass',
          detail: 'Financial data consent managers have connected over 60 million customer accounts, shrinking underwriting time from 3 days to 45 seconds.',
          type: 'Opportunity',
          impact_score: 5,
          source_url: 'https://www.niti.gov.in/verticals/finance-and-financial-inclusion',
        },
        {
          id: 'fin_tech_2',
          title: 'Sophisticated Synthetic Identity Fraud and Deepfake KYC Threats',
          detail: 'Fintech platforms face elevated operational losses from generative AI video manipulations during automated video customer identification.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
        },
      ],
      legal: [
        {
          id: 'fin_leg_1',
          title: 'Digital Personal Data Protection Act (DPDP) Compliance Clarity',
          detail: 'Clear consent architectures protect consumer rights while giving compliant enterprise fintechs defensible operational moats.',
          type: 'Opportunity',
          impact_score: 3,
          source_url: 'https://www.niti.gov.in/verticals/finance-and-financial-inclusion',
        },
        {
          id: 'fin_leg_2',
          title: 'Strict RBI Payment Aggregator Licensing Barrier',
          detail: 'Mandatory in-principle authorization and minimum net-worth hurdles have delayed new entrant launches by 9 to 18 months.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
        },
      ],
      environmental: [
        {
          id: 'fin_env_1',
          title: 'Green Fintech & Sovereign Green Bond Securitization',
          detail: 'SEBI frameworks for ESG debt and retail micro-investments in community solar projects open up novel fee-generating wealth-tech verticals.',
          type: 'Opportunity',
          impact_score: 3,
          source_url: 'https://www.niti.gov.in/verticals/finance-and-financial-inclusion',
        },
        {
          id: 'fin_env_2',
          title: 'Data Center Energy Footprint Disclosures',
          detail: 'Emerging mandates for high-frequency algorithmic payment infrastructures to report Scope 2 cloud carbon intensity metrics.',
          type: 'Risk',
          impact_score: -1,
          source_url: 'https://www.niti.gov.in/verticals/finance-and-financial-inclusion',
        },
      ],
    },
  },
  'autonomous vehicles_united states': {
    industry: 'Autonomous Vehicles',
    target_country: 'United States',
    timestamp: new Date().toISOString(),
    summary:
      'The US Autonomous Vehicle sector is transitioning from speculative pilot testing to commercial scale across key Sunbelt metros. However, heightened federal safety scrutiny by NHTSA and complex state liability statutes create persistent operational bottlenecks.',
    overall_sentiment_score: 1.4,
    cached: false,
    model_used: 'gemini-2.0-flash (Simulated Intelligence)',
    tavily_query:
      'Autonomous Vehicles United States (policy OR market economy OR consumer trends OR tech innovation OR regulation OR climate environmental laws)',
    sources: [
      {
        title: 'NHTSA Standing General Order for Crash Reporting for ADS',
        url: 'https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting',
        content:
          'Mandatory reporting of all automated driving system incidents within 24 hours created unprecedented regulatory visibility and liability transparency.',
        published_date: '2024-04-18',
        score: 0.94,
      },
      {
        title: 'California CPUC Driverless Commercial Deployment Permits',
        url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        content:
          'Commercial robotaxi operations expanded in San Francisco and Los Angeles with 24/7 geofenced ridehailing services showing positive unit economics.',
        published_date: '2024-03-01',
        score: 0.92,
      },
    ],
    pestle_breakdown: {
      political: [
        {
          id: 'av_pol_1',
          title: 'Bipartisan Push for National Autonomous Vehicle Testing Standards',
          detail: 'Congressional momentum to replace fragmented 50-state regulations with a unified federal deployment framework.',
          type: 'Opportunity',
          impact_score: 3,
          source_url: 'https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting',
        },
        {
          id: 'av_pol_2',
          title: 'Municipal Pushback Over Emergency Vehicle Blockages',
          detail: 'City councils and first responders in major metropolitan areas demand localized kill-switches and zoning speed limits.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        },
      ],
      economic: [
        {
          id: 'av_eco_1',
          title: 'Rapidly Declining Sensor Suite and LiDAR Unit Costs',
          detail: 'Next-gen solid-state LiDAR and customized AI inference chips reduced BOM hardware costs per robotaxi vehicle by over 60%.',
          type: 'Opportunity',
          impact_score: 4,
          source_url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        },
        {
          id: 'av_eco_2',
          title: 'Extensive Commercial Fleet Depots & Teleoperation Overheads',
          detail: 'Remote intervention center staffing, fleet cleaning, and charging infrastructure keep initial market expansion cash-burn intensive.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting',
        },
      ],
      social: [
        {
          id: 'av_soc_1',
          title: 'Increased Consumer Acceptance in Established Sunbelt Hubs',
          detail: 'Rider trust metrics in Phoenix and Austin show repeat usage rates surpassing traditional ridehailing due to privacy and consistency.',
          type: 'Opportunity',
          impact_score: 3,
          source_url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        },
        {
          id: 'av_soc_2',
          title: 'Labor Union Backlash from Commercial Drivers and Teamsters',
          detail: 'Major transport labor unions lobby state legislatures to ban driverless commercial freight trucks over 10,000 lbs without human operators.',
          type: 'Risk',
          impact_score: -4,
          source_url: 'https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting',
        },
      ],
      technological: [
        {
          id: 'av_tech_1',
          title: 'End-to-End Foundation Vision-Language-Action Models',
          detail: 'Transition from hand-crafted rule heuristic stacks to unified neural networks drastically improves handling of rare long-tail corner cases.',
          type: 'Opportunity',
          impact_score: 5,
          source_url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        },
        {
          id: 'av_tech_2',
          title: 'Adverse Weather Edge Cases (Blizzards & Heavy Torrential Rain)',
          detail: 'Severe precipitation remains an unsolved obstacle for pure optical/LiDAR systems, limiting deployment in northern US geographies.',
          type: 'Risk',
          impact_score: -3,
          source_url: 'https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting',
        },
      ],
      legal: [
        {
          id: 'av_leg_1',
          title: 'Commercial Carrier Operating Permit Expansions',
          detail: 'State DMVs establish predictable licensing lanes allowing commercial fares to be collected for driverless rides.',
          type: 'Opportunity',
          impact_score: 3,
          source_url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        },
        {
          id: 'av_leg_2',
          title: 'High Tort Liability and Class Action Exposure on Autopilot Claims',
          detail: 'Product liability lawsuits shifting damages from driver error to OEM manufacturing defect dramatically raise commercial insurance premiums.',
          type: 'Risk',
          impact_score: -4,
          source_url: 'https://www.nhtsa.gov/laws-regulations/standing-general-order-crash-reporting',
        },
      ],
      environmental: [
        {
          id: 'av_env_1',
          title: 'Synergy with Dedicated EV Fleet Charging Optimization',
          detail: 'Centralized robotic charging at off-peak overnight tariffs minimizes carbon intensity and lowers per-mile fuel expenditures.',
          type: 'Opportunity',
          impact_score: 4,
          source_url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        },
        {
          id: 'av_env_2',
          title: 'Empty Vehicle Miles Traveled (VMT) Congestion Concerns',
          detail: 'City transport planners raise concerns that cruising empty robotaxis could increase urban congestion and aggregate tire wear emissions.',
          type: 'Risk',
          impact_score: -2,
          source_url: 'https://www.cpuc.ca.gov/regulatory-services/licensing/transportation-licensing/autonomous-vehicle-programs',
        },
      ],
    },
  },
};

export function getMockPreset(industry: string, targetCountry: string): ScanResponseData | null {
  const normKey = `${industry.trim().toLowerCase()}_${targetCountry.trim().toLowerCase()}`;
  if (MOCK_PRESETS[normKey]) {
    return {
      ...MOCK_PRESETS[normKey],
      timestamp: new Date().toISOString(),
    };
  }

  // Check if both industry and country match a preset
  for (const [key, preset] of Object.entries(MOCK_PRESETS)) {
    const [ind, ctry] = key.split('_');
    const indMatch = industry.toLowerCase().includes(ind) || ind.includes(industry.toLowerCase());
    const ctryMatch = targetCountry.toLowerCase().includes(ctry) || ctry.includes(targetCountry.toLowerCase());
    if (indMatch && ctryMatch) {
      return {
        ...preset,
        industry,
        target_country: targetCountry,
        timestamp: new Date().toISOString(),
      };
    }
  }

  return null;
}
