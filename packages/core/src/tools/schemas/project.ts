import { z } from 'zod';

/**
 * Descriptions shared by the category and workflow-status tools.
 *
 * The API reference names operations by path; tool descriptions must name the
 * equivalent tool instead, so these strings are written in tool terms.
 */
export const PROJECT_ID_DESCRIPTION =
  'ID of the project, as `get_projects` reports it.';

export const CATEGORY_ID_DESCRIPTION =
  'ID of the category, as `get_project_categories` reports it.';

export const WORKFLOW_STATUS_KEY_DESCRIPTION =
  'Key of the status, exactly as `get_project_workflow_statuses` reports it. A built-in status uses a plain word such as `publish`; one the account created may be keyed `wfs#12`, which the `key` argument takes as `wfs%2312`, because a bare `#` starts a fragment.';

/**
 * A category as the category tools report it.
 */
export const categorySchema = z.object({
  id: z
    .number()
    .describe(
      'Category id. Report it as the `category` of a sitemap item and pass it as the `category` filter of `get_assignments`.'
    ),
  name: z.string().describe('Category name, as the account spelled it.'),
  color: z
    .string()
    .nullable()
    .describe(
      'Color the application paints the category with, when one is set. Null when the category has no color.'
    ),
  editable: z
    .boolean()
    .describe(
      'False for a category every account shares: its name cannot be changed and it cannot be deleted, only recoloured and hidden. True for a category this account created.'
    ),
});

/**
 * A workflow status as the workflow-status tools report it.
 */
export const workflowStatusSchema = z.object({
  id: z
    .union([z.number(), z.string()])
    .describe(
      'Identifier of the status: the key itself for a built-in status, a numeric id for one the account created.'
    ),
  key: z
    .string()
    .describe(
      'Stable key of the status, for example `publish`. This is the value an item carries in `workflowStatus`, the value to send as the `workflow` filter of `get_assignments`, and the value the `key` argument of `update_project_workflow_status`, `delete_project_workflow_status` and `move_project_workflow_status` takes. A status the account created may be keyed `wfs#12`; a `key` argument takes it as `wfs%2312`, because a bare `#` starts a fragment.'
    ),
  name: z.string().describe('Name the application shows for the status.'),
  parentKey: z
    .string()
    .nullable()
    .describe(
      'Key of the parent status when this one is nested under another in the application’s menu. Null for a top-level status.'
    ),
  color: z
    .string()
    .nullable()
    .describe(
      'Color the application paints the status with. Null when the status has no color.'
    ),
  editable: z
    .boolean()
    .describe(
      'False for one of the ten built-in statuses: it can be recoloured, reordered and hidden, but not renamed, deleted or nested. True for a status this account created.'
    ),
});
