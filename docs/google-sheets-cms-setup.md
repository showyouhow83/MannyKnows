# Google Sheets CMS Setup Guide

## Overview
This document provides the complete setup for MannyKnows Google Sheets CMS that will serve as the single source of truth for all services, driving both the website footer and Manny AI's knowledge base.

## Google Sheets Structure

### Sheet Name: "MannyKnows### Phase 2: ServiceArchitecture Integration  
- [x] Update ServiceArchitecture.ts to load from KV first
- [x] Implement 5-minute cache with fallback to hardcoded data
- [x] Update all service access and filtering logic
- [x] Test with different user tiers (public/verified/premium)ices_CMS"
**Tab Name: "Services"**

### Column Structure
| Column | Field Name | Data Type | Description | Example |
|--------|------------|-----------|-------------|---------|
| A | name | string | Internal service identifier (snake_case) | website_analysis |
| B | displayName | string | User-facing service name | Website Analysis |
| C | description | string | Brief service description (1-2 sentences) | Comprehensive analysis of website performance, SEO, and conversion optimization opportunities. |
| D | accessLevel | enum | User access requirement | public / verified / premium |
| E | serviceType | enum | Type of service offering | ai_tool / business_service / hybrid |
| F | businessCategory | enum | Primary business category | ecommerce / web_design / automation / ai_agents / photography / 360_services / analytics / content / training |
| G | deliveryMethod | enum | How service is delivered | instant / consultation / project / hybrid |
| H | hasAIAssistance | boolean | AI component available | TRUE / FALSE |
| I | canDemoInChat | boolean | Can be demonstrated in chat | TRUE / FALSE |
| J | aiCostLevel | enum | AI processing cost tier | low / medium / high |
| K | processingTime | string | Expected completion time | instant / 1-3 days / 1-2 weeks |
| L | functionName | string | OpenAI function identifier | analyze_website |
| M | parameters | JSON | Function parameters schema | {"url": "string", "depth": "number"} |
| N | shortDescription | string | Footer-friendly description | SEO & Performance Analysis |
| O | price | string | Pricing information | Free Analysis / Starting at $297 |
| P | isActive | boolean | Service currently available | TRUE / FALSE |
| Q | sortOrder | number | Display priority | 1-100 |

## Complete Service Database

### eCommerce Services
```
Row 2: ecommerce_analysis, eCommerce Store Analysis, Complete analysis of online store performance including conversion rates, user experience, and sales optimization opportunities., public, ai_tool, ecommerce, instant, TRUE, TRUE, medium, instant, analyze_ecommerce_store, {"store_url": "string", "analysis_depth": "string"}, Store Performance Analysis, Free Analysis, TRUE, 1

Row 3: product_description_generator, AI Product Descriptions, Generate compelling product descriptions that drive sales using AI-powered copywriting optimized for your target audience., verified, ai_tool, ecommerce, instant, TRUE, TRUE, low, instant, generate_product_descriptions, {"product_info": "string", "tone": "string", "target_audience": "string"}, AI-Powered Product Copy, $49/month, TRUE, 2

Row 4: abandoned_cart_recovery, Cart Recovery Automation, Automated email sequences to recover abandoned carts with personalized messaging and smart timing optimization., premium, business_service, ecommerce, project, TRUE, FALSE, high, 1-3 days, setup_cart_recovery, {"email_platform": "string", "store_type": "string"}, Recover Lost Sales, Starting at $297, TRUE, 3

Row 5: inventory_optimization, AI Inventory Management, Predictive inventory management using AI to optimize stock levels, reduce holding costs, and prevent stockouts., premium, hybrid, ecommerce, project, TRUE, TRUE, high, 1-2 weeks, optimize_inventory, {"current_system": "string", "product_categories": "array"}, Smart Inventory Control, Starting at $497, TRUE, 4

Row 6: conversion_optimization, Conversion Rate Optimization, Data-driven CRO strategies including A/B testing, heatmap analysis, and user journey optimization to maximize sales., verified, business_service, ecommerce, consultation, FALSE, FALSE, medium, 1-2 weeks, analyze_conversion_funnel, {"website_url": "string", "goals": "array"}, Boost Your Sales Rate, Starting at $197, TRUE, 5

Row 7: customer_segmentation, Customer Segmentation AI, Advanced customer segmentation using behavioral data and predictive analytics to create targeted marketing campaigns., premium, ai_tool, ecommerce, instant, TRUE, TRUE, medium, instant, segment_customers, {"customer_data": "string", "segmentation_criteria": "array"}, Know Your Customers, $97/month, TRUE, 6
```

### Web Design Services
```
Row 8: website_redesign, Website Redesign, Complete website redesign focused on modern UX/UI principles, mobile optimization, and conversion-driven design., verified, business_service, web_design, project, TRUE, FALSE, low, 2-4 weeks, plan_website_redesign, {"current_site": "string", "goals": "array", "budget_range": "string"}, Modern Website Design, Starting at $2,497, TRUE, 7

Row 9: landing_page_optimization, Landing Page Builder, AI-powered landing page creation and optimization tool that generates high-converting pages based on your industry and goals., public, ai_tool, web_design, instant, TRUE, TRUE, medium, instant, create_landing_page, {"business_type": "string", "campaign_goal": "string", "target_audience": "string"}, High-Converting Pages, Free Trial, TRUE, 8

Row 10: mobile_optimization, Mobile Optimization, Comprehensive mobile optimization including responsive design, page speed optimization, and mobile-first user experience improvements., verified, business_service, web_design, project, FALSE, FALSE, medium, 1-2 weeks, optimize_mobile_experience, {"website_url": "string", "priority_pages": "array"}, Mobile-First Design, Starting at $497, TRUE, 9

Row 11: accessibility_audit, Web Accessibility Audit, Complete WCAG compliance audit and remediation to ensure your website is accessible to all users and meets legal requirements., verified, business_service, web_design, consultation, FALSE, FALSE, low, 3-5 days, audit_accessibility, {"website_url": "string", "compliance_level": "string"}, ADA Compliance Check, Starting at $297, TRUE, 10

Row 12: speed_optimization, Website Speed Optimization, Advanced page speed optimization including image compression, code minification, CDN setup, and Core Web Vitals improvement., public, hybrid, web_design, instant, TRUE, TRUE, medium, instant, optimize_website_speed, {"website_url": "string", "current_speed": "number"}, Lightning Fast Sites, Free Analysis, TRUE, 11
```

### Automation Services
```
Row 13: workflow_automation, Business Process Automation, Custom workflow automation using tools like Zapier, Make.com, and API integrations to streamline repetitive business tasks., verified, business_service, automation, project, TRUE, FALSE, medium, 1-2 weeks, automate_workflow, {"current_process": "string", "tools_used": "array", "volume": "number"}, Automate Everything, Starting at $397, TRUE, 12

Row 14: email_automation, Email Marketing Automation, Advanced email automation sequences including welcome series, nurture campaigns, and behavioral triggers for maximum engagement., verified, hybrid, automation, project, TRUE, TRUE, low, 3-5 days, setup_email_automation, {"email_platform": "string", "audience_size": "number", "campaign_goals": "array"}, Smart Email Marketing, Starting at $197, TRUE, 13

Row 15: social_media_automation, Social Media Automation, Automated social media posting, content curation, and engagement tracking across multiple platforms with AI-powered optimization., premium, ai_tool, automation, instant, TRUE, TRUE, medium, instant, automate_social_media, {"platforms": "array", "content_types": "array", "posting_frequency": "string"}, Auto Social Media, $147/month, TRUE, 14

Row 16: lead_qualification, Lead Qualification Automation, AI-powered lead scoring and qualification system that automatically prioritizes prospects and triggers appropriate follow-up actions., premium, ai_tool, automation, project, TRUE, TRUE, high, 1-3 days, qualify_leads_automatically, {"crm_system": "string", "qualification_criteria": "array"}, Smart Lead Scoring, Starting at $297, TRUE, 15

Row 17: data_sync, Data Synchronization, Automated data synchronization between multiple business systems including CRM, email platforms, and analytics tools., verified, business_service, automation, project, FALSE, FALSE, medium, 1-2 weeks, sync_business_data, {"source_systems": "array", "target_systems": "array", "sync_frequency": "string"}, Keep Data in Sync, Starting at $497, TRUE, 16
```

### AI Agents Services
```
Row 18: chatbot_development, Custom AI Chatbots, Intelligent chatbots trained on your business data to handle customer service, sales qualification, and lead generation 24/7., premium, ai_tool, ai_agents, project, TRUE, TRUE, high, 1-2 weeks, create_custom_chatbot, {"business_type": "string", "use_cases": "array", "integration_requirements": "array"}, 24/7 AI Assistant, Starting at $797, TRUE, 17

Row 19: ai_customer_service, AI Customer Service Agent, Advanced AI agent that handles customer inquiries, processes returns, and escalates complex issues while maintaining brand voice., premium, ai_tool, ai_agents, project, TRUE, FALSE, high, 2-3 weeks, deploy_service_agent, {"current_support_volume": "number", "common_inquiries": "array", "escalation_rules": "array"}, Automate Support, Starting at $997, TRUE, 18

Row 20: ai_sales_assistant, AI Sales Assistant, Intelligent sales agent that qualifies leads, schedules appointments, and nurtures prospects through personalized conversations., premium, ai_tool, ai_agents, project, TRUE, FALSE, high, 1-2 weeks, create_sales_agent, {"sales_process": "string", "qualification_criteria": "array", "crm_integration": "string"}, AI Sales Team, Starting at $1,297, TRUE, 19

Row 21: ai_content_moderator, AI Content Moderation, Automated content moderation for social media, forums, and user-generated content using advanced AI filtering and human oversight., premium, ai_tool, ai_agents, instant, TRUE, TRUE, medium, instant, moderate_content, {"content_types": "array", "moderation_rules": "array", "platform": "string"}, Smart Content Filter, $197/month, TRUE, 20

Row 22: voice_ai_assistant, Voice AI Assistant, Custom voice AI assistants for phone systems, smart speakers, and voice-enabled applications with natural conversation capabilities., premium, ai_tool, ai_agents, project, TRUE, FALSE, high, 2-4 weeks, create_voice_assistant, {"use_case": "string", "voice_type": "string", "integration_platform": "string"}, Voice AI Solutions, Starting at $1,497, TRUE, 21
```

### Photography Services
```
Row 23: product_photography, Product Photography, Professional product photography with studio lighting, multiple angles, and lifestyle shots optimized for eCommerce and marketing., verified, business_service, photography, project, FALSE, FALSE, low, 1-2 weeks, schedule_product_shoot, {"product_types": "array", "quantity": "number", "usage_rights": "string"}, Stunning Product Photos, Starting at $297, TRUE, 22

Row 24: ai_photo_editing, AI Photo Enhancement, Advanced AI-powered photo editing including background removal, color correction, and automated retouching for professional results., public, ai_tool, photography, instant, TRUE, TRUE, low, instant, enhance_photos, {"photo_urls": "array", "enhancement_type": "string", "output_format": "string"}, Perfect Photos Instantly, Free Trial, TRUE, 23

Row 25: virtual_staging, Virtual Staging, AI-powered virtual staging for real estate photos, adding furniture and decor to empty spaces for better property presentation., verified, ai_tool, photography, instant, TRUE, TRUE, medium, instant, stage_property_photos, {"property_photos": "array", "room_types": "array", "style_preference": "string"}, Transform Empty Spaces, $47/room, TRUE, 24

Row 26: image_optimization, Image Optimization, Bulk image optimization for websites including compression, format conversion, and SEO-friendly alt text generation., public, ai_tool, photography, instant, TRUE, TRUE, low, instant, optimize_images, {"image_urls": "array", "target_format": "string", "quality_level": "string"}, Web-Ready Images, Free Analysis, TRUE, 25

Row 27: drone_photography, Drone Photography, Professional aerial photography and videography services for real estate, events, and commercial properties., verified, business_service, photography, project, FALSE, FALSE, low, 3-7 days, schedule_drone_shoot, {"location": "string", "shoot_type": "string", "duration": "number"}, Aerial Perspectives, Starting at $497, TRUE, 26
```

### 360 Services
```
Row 28: virtual_tours, 360° Virtual Tours, Immersive virtual tours for real estate, retail spaces, and venues with interactive hotspots and embedded multimedia content., verified, business_service, 360_services, project, TRUE, FALSE, medium, 1-2 weeks, create_virtual_tour, {"property_type": "string", "square_footage": "number", "special_features": "array"}, Immersive Experiences, Starting at $397, TRUE, 27

Row 29: vr_training, VR Training Programs, Custom virtual reality training programs for employee onboarding, safety training, and skill development with progress tracking., premium, business_service, 360_services, project, TRUE, FALSE, high, 3-4 weeks, develop_vr_training, {"training_type": "string", "employee_count": "number", "learning_objectives": "array"}, Next-Gen Training, Starting at $2,497, TRUE, 28

Row 30: ar_try_on, AR Try-On Solutions, Augmented reality solutions for product visualization, virtual try-ons, and interactive product demonstrations., premium, hybrid, 360_services, project, TRUE, TRUE, high, 2-3 weeks, implement_ar_solution, {"product_categories": "array", "platform_requirements": "array"}, Virtual Try-Before-Buy, Starting at $1,997, TRUE, 29

Row 31: panoramic_photography, Panoramic Photography, High-resolution 360° panoramic photography for virtual tours, Google Street View, and immersive marketing content., verified, business_service, 360_services, project, FALSE, FALSE, low, 3-5 days, capture_panoramic_photos, {"locations": "array", "tour_type": "string", "resolution_requirements": "string"}, 360° Photography, Starting at $197, TRUE, 30

Row 32: metaverse_presence, Metaverse Brand Presence, Establish your brand presence in virtual worlds and metaverse platforms with custom spaces and interactive experiences., premium, business_service, 360_services, project, TRUE, FALSE, high, 4-6 weeks, build_metaverse_presence, {"platform_preferences": "array", "brand_goals": "array", "target_audience": "string"}, Virtual World Marketing, Starting at $3,497, TRUE, 31
```

### Analytics Services
```
Row 33: google_analytics_setup, Google Analytics 4 Setup, Complete GA4 implementation with custom event tracking, conversion goals, and comprehensive reporting dashboards., verified, business_service, analytics, project, FALSE, FALSE, low, 1-3 days, setup_ga4_tracking, {"website_url": "string", "business_goals": "array", "current_analytics": "string"}, Track What Matters, Starting at $197, TRUE, 32

Row 34: data_visualization, Custom Dashboards, Interactive data visualization dashboards that transform complex business data into actionable insights and beautiful reports., verified, hybrid, analytics, project, TRUE, TRUE, medium, 1-2 weeks, create_custom_dashboard, {"data_sources": "array", "metrics": "array", "stakeholders": "array"}, See Your Data Clearly, Starting at $497, TRUE, 33

Row 35: predictive_analytics, Predictive Analytics, AI-powered predictive models for sales forecasting, customer behavior prediction, and business trend analysis., premium, ai_tool, analytics, project, TRUE, TRUE, high, 2-3 weeks, build_predictive_model, {"historical_data": "string", "prediction_goals": "array", "time_horizon": "string"}, Predict the Future, Starting at $997, TRUE, 34

Row 36: competitor_analysis, Competitive Intelligence, Comprehensive competitor analysis including traffic analysis, keyword research, and strategic positioning insights., public, ai_tool, analytics, instant, TRUE, TRUE, medium, instant, analyze_competitors, {"competitor_urls": "array", "analysis_focus": "array", "your_website": "string"}, Know Your Competition, Free Analysis, TRUE, 35

Row 37: conversion_tracking, Conversion Tracking Setup, Advanced conversion tracking implementation across all marketing channels with attribution modeling and ROI analysis., verified, business_service, analytics, project, FALSE, FALSE, medium, 3-5 days, implement_conversion_tracking, {"marketing_channels": "array", "conversion_goals": "array", "attribution_model": "string"}, Track Every Conversion, Starting at $297, TRUE, 36
```

### Content Services
```
Row 38: content_strategy, Content Strategy Development, Comprehensive content strategy including editorial calendars, SEO optimization, and multi-channel content planning., verified, business_service, content, consultation, TRUE, FALSE, medium, 1-2 weeks, develop_content_strategy, {"business_goals": "array", "target_audience": "string", "content_channels": "array"}, Strategic Content Planning, Starting at $497, TRUE, 37

Row 39: ai_content_generator, AI Content Creation, AI-powered content generation for blogs, social media, product descriptions, and marketing copy with brand voice training., public, ai_tool, content, instant, TRUE, TRUE, low, instant, generate_content, {"content_type": "string", "topic": "string", "brand_voice": "string", "target_length": "number"}, Instant Quality Content, Free Trial, TRUE, 38

Row 40: video_editing, Professional Video Editing, Expert video editing services for marketing videos, tutorials, and social media content with motion graphics and sound design., verified, business_service, content, project, TRUE, FALSE, medium, 1-2 weeks, edit_video_content, {"video_type": "string", "raw_footage_duration": "number", "style_preferences": "array"}, Polished Video Content, Starting at $397, TRUE, 39

Row 41: seo_content_optimization, SEO Content Optimization, Content optimization for search engines including keyword research, on-page SEO, and content gap analysis., verified, hybrid, content, project, TRUE, TRUE, medium, 3-5 days, optimize_content_seo, {"target_keywords": "array", "content_urls": "array", "competitor_analysis": "boolean"}, Rank Higher on Google, Starting at $197, TRUE, 40

Row 42: social_media_content, Social Media Content Creation, Custom social media content creation including graphics, captions, and hashtag strategies for all major platforms., verified, hybrid, content, project, TRUE, TRUE, low, 1-3 days, create_social_content, {"platforms": "array", "posting_frequency": "string", "brand_guidelines": "string"}, Engaging Social Content, Starting at $297, TRUE, 41
```

### Training Services
```
Row 43: ai_training_workshops, AI Training Workshops, Hands-on workshops teaching businesses how to implement and use AI tools effectively in their operations., verified, business_service, training, consultation, FALSE, FALSE, low, 1-2 days, schedule_ai_workshop, {"audience_size": "number", "skill_level": "string", "focus_areas": "array"}, Master AI Tools, Starting at $497, TRUE, 42

Row 44: digital_marketing_training, Digital Marketing Certification, Comprehensive digital marketing training covering SEO, PPC, social media, and analytics with certification., verified, business_service, training, project, TRUE, FALSE, medium, 4-6 weeks, enroll_marketing_course, {"experience_level": "string", "learning_goals": "array", "preferred_schedule": "string"}, Become a Marketing Pro, Starting at $797, TRUE, 43

Row 45: automation_training, Automation Implementation Training, Step-by-step training on implementing business automation tools and workflows with ongoing support., verified, business_service, training, project, TRUE, FALSE, medium, 2-3 weeks, provide_automation_training, {"current_tools": "array", "automation_goals": "array", "team_size": "number"}, Automate Like a Pro, Starting at $597, TRUE, 44

Row 46: analytics_training, Data Analytics Training, Learn to interpret and act on business data with training on Google Analytics, reporting, and data-driven decision making., verified, business_service, training, consultation, TRUE, FALSE, low, 1-2 weeks, teach_analytics_skills, {"current_knowledge": "string", "data_sources": "array", "goals": "array"}, Understand Your Data, Starting at $397, TRUE, 45

Row 47: ecommerce_training, eCommerce Optimization Training, Complete training on eCommerce best practices including conversion optimization, customer experience, and growth strategies., verified, business_service, training, project, TRUE, FALSE, medium, 2-4 weeks, provide_ecommerce_training, {"platform": "string", "current_revenue": "string", "growth_goals": "array"}, Scale Your Store, Starting at $697, TRUE, 46
```

### Additional eCommerce Services (Rows 48-55)
```
Row 48: payment_optimization, Payment Flow Optimization, Optimize checkout processes and payment flows to reduce cart abandonment and increase conversion rates., verified, business_service, ecommerce, project, TRUE, FALSE, medium, 1-2 weeks, optimize_payment_flow, {"current_platform": "string", "payment_methods": "array", "checkout_analytics": "string"}, Smooth Checkout Experience, Starting at $397, TRUE, 47

Row 49: personalization_engine, AI Personalization Engine, Dynamic product recommendations and personalized shopping experiences using machine learning algorithms., premium, ai_tool, ecommerce, project, TRUE, TRUE, high, 2-3 weeks, implement_personalization, {"product_catalog_size": "number", "customer_data": "string", "personalization_goals": "array"}, Personal Shopping AI, Starting at $797, TRUE, 48

Row 50: review_management, Review Management System, Automated review collection, response management, and reputation monitoring across all major review platforms., verified, hybrid, ecommerce, project, TRUE, TRUE, medium, 1-2 weeks, setup_review_management, {"business_locations": "array", "review_platforms": "array", "current_rating": "number"}, Manage Your Reputation, Starting at $297, TRUE, 49

Row 51: loyalty_program, AI-Powered Loyalty Program, Intelligent loyalty programs with predictive rewards, personalized offers, and automated customer retention strategies., premium, ai_tool, ecommerce, project, TRUE, FALSE, high, 2-3 weeks, create_loyalty_program, {"customer_base_size": "number", "average_order_value": "number", "retention_goals": "array"}, Keep Customers Coming Back, Starting at $597, TRUE, 50

Row 52: marketplace_optimization, Marketplace Optimization, Optimization for Amazon, eBay, and other marketplaces including listing optimization and advertising management., verified, business_service, ecommerce, project, TRUE, FALSE, medium, 1-2 weeks, optimize_marketplace_presence, {"marketplaces": "array", "product_categories": "array", "current_performance": "string"}, Dominate Marketplaces, Starting at $497, TRUE, 51
```

### Additional Web Design Services (Rows 56-63)
```
Row 56: brand_identity_design, Brand Identity Design, Complete brand identity development including logo design, color palettes, typography, and brand guidelines., verified, business_service, web_design, project, TRUE, FALSE, low, 2-3 weeks, design_brand_identity, {"business_type": "string", "brand_values": "array", "target_audience": "string", "style_preferences": "array"}, Professional Brand Identity, Starting at $797, TRUE, 52

Row 57: ui_ux_audit, UX/UI Design Audit, Comprehensive user experience audit with actionable recommendations for improving usability and conversion rates., verified, business_service, web_design, consultation, FALSE, FALSE, medium, 3-5 days, conduct_ux_audit, {"website_url": "string", "user_goals": "array", "current_pain_points": "array"}, Improve User Experience, Starting at $397, TRUE, 53

Row 58: email_template_design, Email Template Design, Custom email template design for newsletters, campaigns, and automated sequences with mobile optimization., verified, business_service, web_design, project, FALSE, FALSE, low, 1-2 weeks, design_email_templates, {"email_types": "array", "brand_guidelines": "string", "email_platform": "string"}, Beautiful Email Design, Starting at $297, TRUE, 54

Row 59: graphic_design_service, Custom Graphic Design, Professional graphic design for marketing materials, social media, presentations, and digital assets., verified, business_service, web_design, project, TRUE, FALSE, low, 1-2 weeks, create_graphic_designs, {"design_types": "array", "quantity": "number", "brand_guidelines": "string", "usage_rights": "string"}, Eye-Catching Graphics, Starting at $197, TRUE, 55

Row 60: website_maintenance, Website Maintenance, Ongoing website maintenance including updates, security monitoring, backups, and performance optimization., verified, business_service, web_design, hybrid, TRUE, FALSE, low, ongoing, setup_maintenance_plan, {"website_platform": "string", "update_frequency": "string", "security_requirements": "array"}, Keep Your Site Healthy, $197/month, TRUE, 56
```

### Additional Automation Services (Rows 64-71)
```
Row 64: crm_automation, CRM Automation Setup, Advanced CRM automation including lead nurturing, sales pipeline management, and customer lifecycle automation., verified, business_service, automation, project, TRUE, FALSE, medium, 1-2 weeks, automate_crm_workflows, {"crm_platform": "string", "sales_process": "string", "team_size": "number"}, Streamline Your Sales, Starting at $497, TRUE, 57

Row 65: inventory_alerts, Smart Inventory Alerts, Automated inventory monitoring with intelligent alerts for stock levels, reorder points, and demand forecasting., verified, ai_tool, automation, instant, TRUE, TRUE, medium, instant, setup_inventory_alerts, {"inventory_system": "string", "product_categories": "array", "alert_preferences": "array"}, Never Run Out of Stock, $97/month, TRUE, 58

Row 66: customer_onboarding, Automated Customer Onboarding, Streamlined customer onboarding automation with welcome sequences, training delivery, and progress tracking., verified, hybrid, automation, project, TRUE, FALSE, medium, 1-2 weeks, automate_onboarding, {"customer_type": "string", "onboarding_steps": "array", "communication_channels": "array"}, Welcome Customers Automatically, Starting at $397, TRUE, 59

Row 67: reporting_automation, Automated Business Reporting, Custom automated reports for key business metrics delivered on schedule to stakeholders., verified, hybrid, automation, project, TRUE, TRUE, medium, 1-2 weeks, setup_automated_reporting, {"data_sources": "array", "report_types": "array", "delivery_schedule": "string"}, Reports That Run Themselves, Starting at $297, TRUE, 60

Row 68: task_automation, Task Management Automation, Automated task creation, assignment, and tracking based on triggers and business rules., verified, business_service, automation, project, TRUE, FALSE, low, 1-2 weeks, automate_task_management, {"current_system": "string", "task_types": "array", "team_structure": "string"}, Organize Work Automatically, Starting at $197, TRUE, 61
```

### Additional AI Agents Services (Rows 72-76)
```
Row 72: ai_receptionist, AI Virtual Receptionist, Intelligent virtual receptionist that handles calls, schedules appointments, and provides information 24/7., premium, ai_tool, ai_agents, project, TRUE, FALSE, high, 1-2 weeks, deploy_virtual_receptionist, {"business_type": "string", "call_volume": "number", "services_offered": "array"}, Never Miss a Call, Starting at $397/month, TRUE, 62

Row 73: ai_data_analyst, AI Data Analyst, Autonomous data analysis agent that generates insights, identifies trends, and creates reports from your business data., premium, ai_tool, ai_agents, project, TRUE, TRUE, high, 2-3 weeks, create_data_analyst_agent, {"data_sources": "array", "analysis_goals": "array", "reporting_frequency": "string"}, AI-Powered Insights, Starting at $797, TRUE, 63

Row 74: ai_social_manager, AI Social Media Manager, Intelligent social media management agent that creates content, schedules posts, and engages with followers., premium, ai_tool, ai_agents, project, TRUE, FALSE, high, 1-2 weeks, deploy_social_media_agent, {"platforms": "array", "brand_voice": "string", "posting_frequency": "string"}, AI Social Media Team, Starting at $497/month, TRUE, 64

Row 75: ai_email_assistant, AI Email Assistant, Smart email management agent that drafts responses, schedules follow-ups, and manages your inbox automatically., premium, ai_tool, ai_agents, project, TRUE, FALSE, high, 1-2 weeks, setup_email_assistant, {"email_volume": "number", "response_types": "array", "escalation_rules": "array"}, Smart Email Management, Starting at $297/month, TRUE, 65

Row 76: ai_research_assistant, AI Research Assistant, Autonomous research agent that gathers market intelligence, competitor insights, and industry trends., premium, ai_tool, ai_agents, instant, TRUE, TRUE, medium, instant, conduct_ai_research, {"research_topic": "string", "sources": "array", "depth": "string"}, AI-Powered Research, $197/month, TRUE, 66
```

### Additional Analytics Services (Rows 77-82)
```
Row 77: heat_map_analysis, Website Heatmap Analysis, Advanced heatmap and user behavior analysis to understand how visitors interact with your website., verified, hybrid, analytics, project, TRUE, TRUE, medium, 1-2 weeks, analyze_user_behavior, {"website_url": "string", "pages_to_analyze": "array", "analysis_duration": "string"}, See Where Users Click, Starting at $297, TRUE, 67

Row 78: attribution_modeling, Multi-Touch Attribution, Advanced attribution modeling to understand the true impact of each marketing channel on conversions., premium, business_service, analytics, project, TRUE, FALSE, high, 2-3 weeks, implement_attribution_model, {"marketing_channels": "array", "conversion_events": "array", "attribution_window": "number"}, Attribute Revenue Correctly, Starting at $797, TRUE, 68

Row 79: cohort_analysis, Customer Cohort Analysis, Detailed cohort analysis to understand customer retention, lifetime value, and behavior patterns over time., verified, ai_tool, analytics, instant, TRUE, TRUE, medium, instant, analyze_customer_cohorts, {"customer_data": "string", "analysis_period": "string", "segmentation_criteria": "array"}, Understand Customer Patterns, Starting at $197, TRUE, 69

Row 80: real_time_monitoring, Real-Time Analytics Dashboard, Live monitoring dashboards for critical business metrics with alerts and automated responses., premium, hybrid, analytics, project, TRUE, TRUE, high, 1-2 weeks, setup_realtime_monitoring, {"metrics": "array", "alert_thresholds": "array", "response_actions": "array"}, Monitor Business Live, Starting at $497, TRUE, 70

Row 81: data_warehouse_setup, Data Warehouse Implementation, Complete data warehouse setup for centralized business intelligence with ETL pipelines and reporting., premium, business_service, analytics, project, TRUE, FALSE, high, 3-4 weeks, implement_data_warehouse, {"data_sources": "array", "storage_requirements": "string", "reporting_needs": "array"}, Centralize Your Data, Starting at $2,497, TRUE, 71

Row 82: ai_insights_engine, AI Insights Engine, Automated insights generation that identifies opportunities, anomalies, and trends in your business data., premium, ai_tool, analytics, instant, TRUE, TRUE, high, instant, generate_ai_insights, {"data_sources": "array", "insight_types": "array", "frequency": "string"}, Discover Hidden Opportunities, $397/month, TRUE, 72
```

## Google Apps Script Setup

### Script Name: "MannyKnows_CMS_Sync"

### Environment Variables Needed:
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN  
- KV_NAMESPACE_ID

### Script Code:
```javascript
function syncServicesToKV() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Services');
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  const headers = data[0];
  const services = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] && row[15]) { // Only include active services
      const service = {};
      headers.forEach((header, index) => {
        service[header] = row[index];
      });
      services.push(service);
    }
  }
  
  // Create timestamped version
  const timestamp = new Date().toISOString();
  const versionKey = `services_${timestamp}`;
  
  // Upload to Cloudflare KV
  const kvData = {
    services: services,
    lastUpdated: timestamp,
    version: versionKey
  };
  
  uploadToKV(versionKey, JSON.stringify(kvData));
  uploadToKV('services_latest', versionKey);
  
  Logger.log(`Synced ${services.length} services to KV as ${versionKey}`);
}

function uploadToKV(key, value) {
  const accountId = PropertiesService.getScriptProperties().getProperty('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = PropertiesService.getScriptProperties().getProperty('CLOUDFLARE_API_TOKEN');
  const namespaceId = PropertiesService.getScriptProperties().getProperty('KV_NAMESPACE_ID');
  
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`;
  
  const options = {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'text/plain'
    },
    payload: value
  };
  
  UrlFetchApp.fetch(url, options);
}

// Auto-trigger setup
function setupTrigger() {
  ScriptApp.newTrigger('syncServicesToKV')
    .timeBased()
    .everyHours(1)
    .create();
}
```

## Implementation Checklist

### Phase 1: Google Sheets CMS Setup
- [x] Create Google Sheets with exact column structure above
- [x] Input all 82 services from the provided data
- [x] Set up Google Apps Script with KV sync functionality
- [x] Configure Cloudflare KV environment variables
- [x] Test sync functionality and verify KV data structure

### Phase 2: ServiceArchitecture Integration  
- [ ] Update ServiceArchitecture.ts to load from KV first
- [ ] Implement 5-minute cache with fallback to hardcoded data
- [ ] Update all service access and filtering logic
- [ ] Test with different user tiers (anonymous/verified/premium)

### Phase 3: Dynamic Website Integration
- [ ] Update Footer.astro to load services from ServiceArchitecture
- [ ] Create dynamic service pages with URL parameters
- [ ] Update chat.ts to use KV-based service data
- [ ] Test full end-to-end functionality

## Success Criteria
1. Manny can access all 82 services based on user tier
2. Website footer dynamically populates from Google Sheets
3. Service pages generate automatically from CMS data
4. Single source of truth eliminates dual maintenance
5. Non-technical team members can add/edit services in Sheets
