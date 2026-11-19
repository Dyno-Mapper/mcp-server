import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { UploadPart } from '../upload/source.js';
import { get_current_user } from './account/get_current_user.js';
import { get_projects } from './projects/get_projects.js';
import { get_project_details } from './projects/get_project_details.js';
import { create_project_from_url } from './projects/create_project_from_url.js';
import { get_project_url_job_status } from './projects/get_project_url_job_status.js';
import { cancel_project_url_job } from './projects/cancel_project_url_job.js';
import { refresh_project_url } from './projects/refresh_project_url.js';
import { cancel_project_url_refresh } from './projects/cancel_project_url_refresh.js';
import { get_project_categories } from './projects/get_project_categories.js';
import { create_project_category } from './projects/create_project_category.js';
import { update_project_category } from './projects/update_project_category.js';
import { delete_project_category } from './projects/delete_project_category.js';
import { move_project_category } from './projects/move_project_category.js';
import { get_project_workflow_statuses } from './projects/get_project_workflow_statuses.js';
import { create_project_workflow_status } from './projects/create_project_workflow_status.js';
import { update_project_workflow_status } from './projects/update_project_workflow_status.js';
import { delete_project_workflow_status } from './projects/delete_project_workflow_status.js';
import { move_project_workflow_status } from './projects/move_project_workflow_status.js';
import { get_project_sitemap_items } from './projects/get_project_sitemap_items.js';
import { get_project_groups } from './projects/get_project_groups.js';
import { get_project_custom_logins } from './projects/get_project_custom_logins.js';
import { test_project_custom_login } from './projects/test_project_custom_login.js';
import { create_project_from_file } from './projects/create_project_from_file.js';
import { get_project_file_job_status } from './projects/get_project_file_job_status.js';
import { cancel_project_file_job } from './projects/cancel_project_file_job.js';
import { refresh_project_file } from './projects/refresh_project_file.js';
import { cancel_project_file_refresh } from './projects/cancel_project_file_refresh.js';
import { get_project_custom_login_test_result } from './projects/get_project_custom_login_test_result.js';
import { get_project_vacq_score } from './projects/get_project_vacq_score.js';
import { get_project_dacq_score } from './projects/get_project_dacq_score.js';
import { get_project_login_inputs } from './projects/get_project_login_inputs.js';
import { submit_project_login_input } from './projects/submit_project_login_input.js';
import { create_project_from_sharepoint } from './projects/create_project_from_sharepoint.js';
import { create_project_from_scratch } from './projects/create_project_from_scratch.js';
import { get_project_sitemap_item_details } from './projects/get_project_sitemap_item_details.js';
import { create_project_sitemap_item } from './sitemap/create_project_sitemap_item.js';
import { bulk_update_project_sitemap_items } from './sitemap/bulk_update_project_sitemap_items.js';
import { update_project_sitemap_item } from './sitemap/update_project_sitemap_item.js';
import { delete_project_sitemap_item } from './sitemap/delete_project_sitemap_item.js';
import { bulk_delete_project_sitemap_items } from './sitemap/bulk_delete_project_sitemap_items.js';
import { move_project_sitemap_item } from './sitemap/move_project_sitemap_item.js';
import { bulk_move_project_sitemap_items } from './sitemap/bulk_move_project_sitemap_items.js';
import { duplicate_project_sitemap_item } from './sitemap/duplicate_project_sitemap_item.js';
import { sort_project_sitemap_items } from './sitemap/sort_project_sitemap_items.js';
import { get_project_sitemap_undo } from './sitemap/get_project_sitemap_undo.js';
import { undo_project_sitemap_edit } from './sitemap/undo_project_sitemap_edit.js';
import { get_project_sitemap_redo } from './sitemap/get_project_sitemap_redo.js';
import { redo_project_sitemap_edit } from './sitemap/redo_project_sitemap_edit.js';
import { get_project_sitemap_item_content } from './sitemap/get_project_sitemap_item_content.js';
import { replace_project_sitemap_item_content } from './sitemap/replace_project_sitemap_item_content.js';
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
import { get_all_project_comments } from './comments/get_all_project_comments.js';
import { get_item_comments } from './comments/get_item_comments.js';
import { create_item_comment } from './comments/create_item_comment.js';
import { update_item_comment } from './comments/update_item_comment.js';
import { delete_item_comment } from './comments/delete_item_comment.js';
import { get_visibility_project_ranking } from './visibility/get_visibility_project_ranking.js';
import { get_visibility_project_score } from './visibility/get_visibility_project_score.js';
import { get_visibility_project_groups } from './visibility/get_visibility_project_groups.js';
import { create_visibility_keyword_group } from './visibility/create_visibility_keyword_group.js';
import { delete_visibility_keyword_group } from './visibility/delete_visibility_keyword_group.js';
import { create_visibility_keywords } from './visibility/create_visibility_keywords.js';
import { update_visibility_keywords_group } from './visibility/update_visibility_keywords_group.js';
import { update_visibility_keyword_setting } from './visibility/update_visibility_keyword_setting.js';
import { get_visibility_keyword_ranking } from './visibility/get_visibility_keyword_ranking.js';
import { get_visibility_locales } from './visibility/get_visibility_locales.js';
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
import { run_accessibility_pdf_upload_test } from './accessibility/run_accessibility_pdf_upload_test.js';
import { run_accessibility_pdf_url_test } from './accessibility/run_accessibility_pdf_url_test.js';
import { run_accessibility_pdf_sitemap_test } from './accessibility/run_accessibility_pdf_sitemap_test.js';
import { get_accessibility_pdf_run } from './accessibility/get_accessibility_pdf_run.js';
import { delete_accessibility_pdf_item } from './accessibility/delete_accessibility_pdf_item.js';
import { refresh_accessibility_pdf_item } from './accessibility/refresh_accessibility_pdf_item.js';
import { archive_accessibility_pdf_results } from './accessibility/archive_accessibility_pdf_results.js';
import { unarchive_accessibility_pdf_results } from './accessibility/unarchive_accessibility_pdf_results.js';
import { set_accessibility_pdf_result_note } from './accessibility/set_accessibility_pdf_result_note.js';
import { get_accessibility_login_inputs } from './accessibility/get_accessibility_login_inputs.js';
import { submit_accessibility_login_input } from './accessibility/submit_accessibility_login_input.js';
import { upload_file } from './files/upload_file.js';
import { store_content_image } from './content/store_content_image.js';
import { get_content_images } from './content/get_content_images.js';
import { delete_content_image } from './content/delete_content_image.js';
import { store_content_file } from './content/store_content_file.js';
import { get_content_files } from './content/get_content_files.js';
import { delete_content_file } from './content/delete_content_file.js';
import { get_assignments } from './assignments/get_assignments.js';
import { get_project_assignments } from './assignments/get_project_assignments.js';
import { get_assignments_totals } from './assignments/get_assignments_totals.js';
import { get_project_assignments_totals } from './assignments/get_project_assignments_totals.js';
import { get_assignment_details } from './assignments/get_assignment_details.js';

/**
 * Which artifact is serving the call.
 *
 * The two are not interchangeable: stdio runs on the caller's machine and can
 * read its filesystem, a hosted server cannot. A tool that differs declares
 * how, rather than having its differences kept in a table elsewhere.
 */
export type TransportMode = 'stdio' | 'hosted';

/** What a tool is told about the call it is part of. */
export interface ToolContext {
  mode: TransportMode;
  /**
   * Budget for the whole call, in milliseconds. Set by the hosted transport
   * only, where a call has a deadline its caller is waiting on.
   */
  timeoutMs?: number;
}

/** A call a tool prepared from its arguments. */
export interface PreparedCall {
  /** Arguments to send, which may differ from the ones the caller gave. */
  args: any;
  /** Bytes an upload sends, when the source was not a local path. */
  upload?: UploadPart;
  /** Where those bytes came from, for the operator's log line. */
  source?: 'file' | 'content' | 'url';
}

/**
 * Either a prepared call or the refusal to make one.
 *
 * A tool that has work to do before the API is called — resolving a file into
 * bytes, say — reports a refusal as a result rather than as a thrown error,
 * because a caller's bad file is a tool error, not a crash. A refusal still
 * names which source was attempted, so the operator's line can say so.
 */
export type PrepareResult =
  | PreparedCall
  | { error: CallToolResult; source?: PreparedCall['source'] };

export interface Tool {
  name: string;
  description: string;
  /**
   * The arguments this tool takes, per transport where they differ.
   *
   * A function is how a tool says it accepts different arguments depending on
   * where it runs: `upload_file` takes a path on stdio and bytes on a hosted
   * server. Everything else is one schema for both.
   */
  inputSchema: z.ZodObject<any> | ((mode: TransportMode) => z.ZodObject<any>);
  outputSchema: z.ZodObject<any>;
  method: string;
  path: string;
  /**
   * `'fields'` sends every argument as its own form field next to the file,
   * which is the shape an upload expects. Uploads are the only calls that
   * take a file: an import names a key the upload returned instead.
   */
  multipart?: 'fields';
  /**
   * Resolves arguments before the call is made.
   *
   * `upload_file` uses it to turn base64 or a URL into the bytes an upload
   * sends. A tool without one sends its arguments as the caller gave them.
   */
  prepare?: (args: any, context: ToolContext) => Promise<PrepareResult>;
}

/** The input schema a tool offers on one transport. */
export function inputSchemaFor(
  tool: Tool,
  mode: TransportMode = 'stdio'
): z.ZodObject<any> {
  return typeof tool.inputSchema === 'function'
    ? tool.inputSchema(mode)
    : tool.inputSchema;
}

export const tools: Record<string, Tool> = {
  get_current_user: get_current_user as any,
  get_projects: get_projects as any,
  get_project_details: get_project_details as any,
  create_project_from_url: create_project_from_url as any,
  get_project_url_job_status: get_project_url_job_status as any,
  cancel_project_url_job: cancel_project_url_job as any,
  refresh_project_url: refresh_project_url as any,
  cancel_project_url_refresh: cancel_project_url_refresh as any,
  get_project_categories: get_project_categories as any,
  create_project_category: create_project_category as any,
  update_project_category: update_project_category as any,
  delete_project_category: delete_project_category as any,
  move_project_category: move_project_category as any,
  get_project_workflow_statuses: get_project_workflow_statuses as any,
  create_project_workflow_status: create_project_workflow_status as any,
  update_project_workflow_status: update_project_workflow_status as any,
  delete_project_workflow_status: delete_project_workflow_status as any,
  move_project_workflow_status: move_project_workflow_status as any,
  get_project_sitemap_items: get_project_sitemap_items as any,
  get_project_groups: get_project_groups as any,
  get_project_custom_logins: get_project_custom_logins as any,
  test_project_custom_login: test_project_custom_login as any,
  get_project_custom_login_test_result:
    get_project_custom_login_test_result as any,
  create_project_from_file: create_project_from_file as any,
  get_project_file_job_status: get_project_file_job_status as any,
  cancel_project_file_job: cancel_project_file_job as any,
  refresh_project_file: refresh_project_file as any,
  cancel_project_file_refresh: cancel_project_file_refresh as any,
  get_project_vacq_score: get_project_vacq_score as any,
  get_project_dacq_score: get_project_dacq_score as any,
  get_project_login_inputs: get_project_login_inputs as any,
  submit_project_login_input: submit_project_login_input as any,
  create_project_from_sharepoint: create_project_from_sharepoint as any,
  create_project_from_scratch: create_project_from_scratch as any,
  get_project_sitemap_item_details: get_project_sitemap_item_details as any,
  create_project_sitemap_item: create_project_sitemap_item as any,
  bulk_update_project_sitemap_items: bulk_update_project_sitemap_items as any,
  update_project_sitemap_item: update_project_sitemap_item as any,
  delete_project_sitemap_item: delete_project_sitemap_item as any,
  bulk_delete_project_sitemap_items: bulk_delete_project_sitemap_items as any,
  move_project_sitemap_item: move_project_sitemap_item as any,
  bulk_move_project_sitemap_items: bulk_move_project_sitemap_items as any,
  duplicate_project_sitemap_item: duplicate_project_sitemap_item as any,
  sort_project_sitemap_items: sort_project_sitemap_items as any,
  get_project_sitemap_undo: get_project_sitemap_undo as any,
  undo_project_sitemap_edit: undo_project_sitemap_edit as any,
  get_project_sitemap_redo: get_project_sitemap_redo as any,
  redo_project_sitemap_edit: redo_project_sitemap_edit as any,
  get_project_sitemap_item_content: get_project_sitemap_item_content as any,
  replace_project_sitemap_item_content:
    replace_project_sitemap_item_content as any,
  get_inventory: get_inventory as any,
  get_inventory_summary: get_inventory_summary as any,
  get_inventory_item_links: get_inventory_item_links as any,
  get_inventory_link_occurrences: get_inventory_link_occurrences as any,
  get_audit_results: get_audit_results as any,
  get_audit_score: get_audit_score as any,
  get_audit_broken_links: get_audit_broken_links as any,
  get_audit_client_error: get_audit_client_error as any,
  get_audit_duplicate_title: get_audit_duplicate_title as any,
  get_audit_missing_title: get_audit_missing_title as any,
  get_audit_long_title: get_audit_long_title as any,
  get_audit_duplicate_description: get_audit_duplicate_description as any,
  get_audit_missing_description: get_audit_missing_description as any,
  get_audit_long_description: get_audit_long_description as any,
  get_audit_non_crawlable: get_audit_non_crawlable as any,
  get_audit_non_indexable: get_audit_non_indexable as any,
  get_audit_orphan_pages: get_audit_orphan_pages as any,
  get_analytics_project: get_analytics_project as any,
  get_analytics_project_daily: get_analytics_project_daily as any,
  get_analytics_project_traffic_source:
    get_analytics_project_traffic_source as any,
  get_analytics_project_events: get_analytics_project_events as any,
  get_analytics_project_pages: get_analytics_project_pages as any,
  get_analytics_sitemap_item: get_analytics_sitemap_item as any,
  get_analytics_sitemap_item_daily: get_analytics_sitemap_item_daily as any,
  get_commented_items: get_commented_items as any,
  get_all_project_comments: get_all_project_comments as any,
  get_item_comments: get_item_comments as any,
  create_item_comment: create_item_comment as any,
  update_item_comment: update_item_comment as any,
  delete_item_comment: delete_item_comment as any,
  get_visibility_project_ranking: get_visibility_project_ranking as any,
  get_visibility_project_score: get_visibility_project_score as any,
  get_visibility_project_groups: get_visibility_project_groups as any,
  create_visibility_keyword_group: create_visibility_keyword_group as any,
  delete_visibility_keyword_group: delete_visibility_keyword_group as any,
  create_visibility_keywords: create_visibility_keywords as any,
  update_visibility_keywords_group: update_visibility_keywords_group as any,
  update_visibility_keyword_setting: update_visibility_keyword_setting as any,
  get_visibility_keyword_ranking: get_visibility_keyword_ranking as any,
  get_visibility_locales: get_visibility_locales as any,
  run_accessibility_checker: run_accessibility_checker as any,
  get_accessibility_results: get_accessibility_results as any,
  delete_accessibility_report: delete_accessibility_report as any,
  get_accessibility_report_items: get_accessibility_report_items as any,
  get_accessibility_history: get_accessibility_history as any,
  get_accessibility_score: get_accessibility_score as any,
  get_accessibility_report_problems: get_accessibility_report_problems as any,
  get_accessibility_report_groups: get_accessibility_report_groups as any,
  get_accessibility_report_item_result:
    get_accessibility_report_item_result as any,
  get_accessibility_pdf_files: get_accessibility_pdf_files as any,
  get_accessibility_pdf_guidelines: get_accessibility_pdf_guidelines as any,
  get_accessibility_pdf_item_result: get_accessibility_pdf_item_result as any,
  run_accessibility_pdf_upload_test: run_accessibility_pdf_upload_test as any,
  run_accessibility_pdf_url_test: run_accessibility_pdf_url_test as any,
  run_accessibility_pdf_sitemap_test: run_accessibility_pdf_sitemap_test as any,
  get_accessibility_pdf_run: get_accessibility_pdf_run as any,
  delete_accessibility_pdf_item: delete_accessibility_pdf_item as any,
  refresh_accessibility_pdf_item: refresh_accessibility_pdf_item as any,
  archive_accessibility_pdf_results: archive_accessibility_pdf_results as any,
  unarchive_accessibility_pdf_results:
    unarchive_accessibility_pdf_results as any,
  set_accessibility_pdf_result_note: set_accessibility_pdf_result_note as any,
  get_accessibility_login_inputs: get_accessibility_login_inputs as any,
  submit_accessibility_login_input: submit_accessibility_login_input as any,
  upload_file: upload_file as any,
  store_content_image: store_content_image as any,
  get_content_images: get_content_images as any,
  delete_content_image: delete_content_image as any,
  store_content_file: store_content_file as any,
  get_content_files: get_content_files as any,
  delete_content_file: delete_content_file as any,
  get_assignments: get_assignments as any,
  get_project_assignments: get_project_assignments as any,
  get_assignments_totals: get_assignments_totals as any,
  get_project_assignments_totals: get_project_assignments_totals as any,
  get_assignment_details: get_assignment_details as any,
};
