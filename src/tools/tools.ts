import { get_current_user } from './account/get_current_user.js';
import { get_projects } from './projects/get_projects.js';
import { get_project_details } from './projects/get_project_details.js';
import { get_project_job_status } from './projects/get_project_job_status.js';
import { cancel_project_job } from './projects/cancel_project_job.js';
import { refresh_project } from './projects/refresh_project.js';
import { get_project_categories } from './projects/get_project_categories.js';
import { get_project_workflow_statuses } from './projects/get_project_workflow_statuses.js';
import { get_project_sitemap_items } from './projects/get_project_sitemap_items.js';
import { get_project_groups } from './projects/get_project_groups.js';
import { get_project_custom_logins } from './projects/get_project_custom_logins.js';
import { get_project_vacq_score } from './projects/get_project_vacq_score.js';
import { get_project_sitemap_item_details } from './projects/get_project_sitemap_item_details.js';
import { get_inventory } from './inventory/get_inventory.js';
import { get_inventory_summary } from './inventory/get_inventory_summary.js';
import { get_inventory_item_links } from './inventory/get_inventory_item_links.js';
import { get_inventory_link_occurrences } from './inventory/get_inventory_link_occurrences.js';
import { get_audit_results } from './audit/get_audit_results.js';
import { get_audit_score } from './audit/get_audit_score.js';
import { get_audit_broken_links } from './audit/get_audit_broken_links.js';
import { get_audit_client_error } from './audit/get_audit_client_error.js';
import { get_audit_duplicate_title } from './audit/get_audit_duplicate_title.js';
import { get_audit_missing_title } from './audit/get_audit_missing_title.js';
import { get_audit_long_title } from './audit/get_audit_long_title.js';
import { get_audit_duplicate_description } from './audit/get_audit_duplicate_description.js';
import { get_audit_missing_description } from './audit/get_audit_missing_description.js';
import { get_audit_long_description } from './audit/get_audit_long_description.js';
import { get_audit_non_crawlable } from './audit/get_audit_non_crawlable.js';
import { get_audit_non_indexable } from './audit/get_audit_non_indexable.js';
import { get_audit_orphan_pages } from './audit/get_audit_orphan_pages.js';
import { get_analytics_project } from './analytics/get_analytics_project.js';
import { get_analytics_project_daily } from './analytics/get_analytics_project_daily.js';
import { get_analytics_project_traffic_source } from './analytics/get_analytics_project_traffic_source.js';
import { get_analytics_project_events } from './analytics/get_analytics_project_events.js';
import { get_analytics_project_pages } from './analytics/get_analytics_project_pages.js';
import { get_analytics_sitemap_item } from './analytics/get_analytics_sitemap_item.js';
import { get_analytics_sitemap_item_daily } from './analytics/get_analytics_sitemap_item_daily.js';
import { get_commented_items } from './comments/get_commented_items.js';
import { get_item_comments } from './comments/get_item_comments.js';
import { get_visibility_project_ranking } from './visibility/get_visibility_project_ranking.js';
import { get_visibility_project_score } from './visibility/get_visibility_project_score.js';
import { get_visibility_project_groups } from './visibility/get_visibility_project_groups.js';
import { get_visibility_keyword_ranking } from './visibility/get_visibility_keyword_ranking.js';
import { run_accessibility_checker } from './accessibility/run_accessibility_checker.js';
import { get_accessibility_results } from './accessibility/get_accessibility_results.js';
import { delete_accessibility_report } from './accessibility/delete_accessibility_report.js';
import { get_accessibility_report_items } from './accessibility/get_accessibility_report_items.js';
import { get_accessibility_history } from './accessibility/get_accessibility_history.js';
import { get_accessibility_score } from './accessibility/get_accessibility_score.js';
import { get_accessibility_report_problems } from './accessibility/get_accessibility_report_problems.js';
import { get_accessibility_report_groups } from './accessibility/get_accessibility_report_groups.js';
import { get_accessibility_report_item_result } from './accessibility/get_accessibility_report_item_result.js';
import { get_accessibility_pdf_files } from './accessibility/get_accessibility_pdf_files.js';
import { get_accessibility_pdf_guidelines } from './accessibility/get_accessibility_pdf_guidelines.js';
import { get_accessibility_pdf_item_result } from './accessibility/get_accessibility_pdf_item_result.js';

export const tools = {
  get_current_user,
  get_projects,
  get_project_details,
  get_project_job_status,
  cancel_project_job,
  refresh_project,
  get_project_categories,
  get_project_workflow_statuses,
  get_project_sitemap_items,
  get_project_groups,
  get_project_custom_logins,
  get_project_vacq_score,
  get_project_sitemap_item_details,
  get_inventory,
  get_inventory_summary,
  get_inventory_item_links,
  get_inventory_link_occurrences,
  get_audit_results,
  get_audit_score,
  get_audit_broken_links,
  get_audit_client_error,
  get_audit_duplicate_title,
  get_audit_missing_title,
  get_audit_long_title,
  get_audit_duplicate_description,
  get_audit_missing_description,
  get_audit_long_description,
  get_audit_non_crawlable,
  get_audit_non_indexable,
  get_audit_orphan_pages,
  get_analytics_project,
  get_analytics_project_daily,
  get_analytics_project_traffic_source,
  get_analytics_project_events,
  get_analytics_project_pages,
  get_analytics_sitemap_item,
  get_analytics_sitemap_item_daily,
  get_commented_items,
  get_item_comments,
  get_visibility_project_ranking,
  get_visibility_project_score,
  get_visibility_project_groups,
  get_visibility_keyword_ranking,
  run_accessibility_checker,
  get_accessibility_results,
  delete_accessibility_report,
  get_accessibility_report_items,
  get_accessibility_history,
  get_accessibility_score,
  get_accessibility_report_problems,
  get_accessibility_report_groups,
  get_accessibility_report_item_result,
  get_accessibility_pdf_files,
  get_accessibility_pdf_guidelines,
  get_accessibility_pdf_item_result,
};
