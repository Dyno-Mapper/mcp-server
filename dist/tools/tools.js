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
};
