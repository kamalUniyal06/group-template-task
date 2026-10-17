# Taskflow backend — SugarCRM 6.5 + SmartGateway

The React app talks to a SugarCRM CE 6.5.25 instance through two entry points:

| Endpoint | Purpose |
| --- | --- |
| `index.php?entryPoint=smart_gateway` | Generic CRUD / relationships / stats (`fetch`, `create`, `update`, `delete`, `fetch_related`, `add_relationship`, …). Requires a signed `X-Api-Token`. |
| `index.php?entryPoint=taskflow_auth` | Login. Checks the SugarCRM user's password and returns the user, their Taskflow role (permission flags) and department. Part of the Taskflow package. |

## Data model (Taskflow package)

| Module | Table | What it holds |
| --- | --- | --- |
| `tf_Departments` | `tf_departments` | Departments / teams (name, colour, description) |
| `tf_Roles` | `tf_roles` | Roles with permission flags: `can_view_all`, `can_view_team`, `can_assign_any`, `can_assign_team`, `can_review`, `can_delete_any`, plus `level` |
| `tf_Tasks` | `tf_tasks` | Tasks: auto-numbered `task_number`, `status`, `priority`, `date_due`, `estimate_hours`, assignee (`assigned_user_id`), creator (`owner_id`), department |
| `tf_Comments` | `tf_comments` | Comments on a task, with `author_id` |
| `tf_Notifications` | `tf_notifications` | Per-user notifications (recipient = `assigned_user_id`), `is_read`, `notif_type`, related task, `actor_id` |
| `Users` (core) | `users` | Gets `tf_role_id` and `tf_department_id` columns |

Relationships (all one-to-many; the link name equals the relationship name, so SmartGateway's `add_relationship` / `fetch_related` find them automatically):

```
tf_Departments ──< Users            tf_departments_users
tf_Roles       ──< Users            tf_roles_users
tf_Departments ──< tf_Tasks         tf_departments_tf_tasks
tf_Tasks       ──< tf_Comments      tf_tasks_tf_comments
tf_Tasks       ──< tf_Notifications tf_tasks_tf_notifications
Users          ──< tf_Tasks / tf_Notifications  (assigned_user_id)
```

**Notifications are created on the server** by logic hooks (`custom/modules/tf_Tasks/TaskflowHooks.php`):

- task created or reassigned → the assignee
- moved to *In review* → reviewers (roles with `can_review`; team-level reviewers only for their department)
- *Done* → assignee and creator; *Blocked* → reviewers; *In review → In progress* → assignee ("changes requested")
- new comment → assignee and creator

The person who made the change is never notified. The frontend sends `last_actor_id` with every task update so the hook knows who that is.

## Local setup (Windows + XAMPP)

SugarCRM 6.5 does not run on PHP 8, so the CRM runs on **PHP 7.4 via FastCGI** while the rest of XAMPP stays on PHP 8.2.

1. **PHP 7.4**: unzip `php-7.4.33-nts-Win32-vc15-x64.zip` (windows.php.net archives) to `C:\xampp\php74`, copy `php.ini-production` to `php.ini`, and enable `curl, fileinfo, gd2, imap, intl, mbstring, mysqli, openssl, pdo_mysql, soap, sockets` with `extension_dir = "C:/xampp/php74/ext"`.
2. **Apache**: in `C:\xampp\apache\conf\httpd.conf` uncomment `LoadModule proxy_fcgi_module modules/mod_proxy_fcgi.so`, copy [`xampp/httpd-taskscrm.conf`](xampp/httpd-taskscrm.conf) to `conf/extra/` and add `Include "conf/extra/httpd-taskscrm.conf"` at the end.
3. **Code**: unzip the SugarCRM archive to `C:\xampp\htdocs\taskscrm`. Add the missing `custom/outright_products/Rightee/FlexibilityHelpers.php` from [`sugarcrm/patches/`](sugarcrm/patches/). Optionally apply [`sugarcrm-6.5-php7-php8.patch`](sugarcrm/patches/sugarcrm-6.5-php7-php8.patch) (the PHP 7.1+ fix in `SugarBean::createRelationshipMeta` is required for the installer; the rest makes the code PHP 8-safe) and copy [`xampp/php8_compat.php`](xampp/php8_compat.php) to `include/`.
4. **Start** XAMPP (Apache + MySQL) and the PHP 7.4 worker: run [`xampp/start-taskscrm-php.bat`](xampp/start-taskscrm-php.bat) (copy it to `C:\xampp\php74\`). It must be running whenever you use the CRM.
5. **Install SugarCRM**: create `config_si.php` (silent install settings) and open `http://localhost/taskscrm/install.php?goto=SilentInstall&cli=true`, or run the normal web installer at `http://localhost/taskscrm/install.php`. Database: `crm_tasks`.
6. **Install the Taskflow package and seed demo data**:

   ```bash
   node backend/sugarcrm/build-package.mjs
   C:\xampp\php74\php.exe -c C:\xampp\php74\php.ini backend\sugarcrm\scripts\install_package.php C:\xampp\htdocs\taskscrm backend\sugarcrm\dist\taskflow_package
   C:\xampp\php74\php.exe -c C:\xampp\php74\php.ini backend\sugarcrm\scripts\seed.php C:\xampp\htdocs\taskscrm
   ```

   Or upload `backend/sugarcrm/dist/taskflow_package.zip` in **Admin → Module Loader** (works on the production server too), then run a Quick Repair & Rebuild.

7. **Frontend**: `npm run dev`. Vite proxies `/crm/*` to `http://localhost/taskscrm`. See [`.env.example`](../.env.example) to point at another CRM.

Seeded accounts: `aarav` (Company Head), `neha` (Manager), `rohan` / `dev` (Team Leaders), `sana`, `isha` (Senior), `kabir`, `zoya` (Junior), `mira` (Intern). Password `demo1234`. New users: create them in SugarCRM and set **Taskflow Role** and **Taskflow Department** on the user record.

## Changing the data model

Edit the definitions in [`sugarcrm/build-package.mjs`](sugarcrm/build-package.mjs) (fields, dropdowns, relationships, list/detail layouts) and the hand-written PHP in [`sugarcrm/src/`](sugarcrm/src/), rebuild, and re-run `install_package.php`. Don't edit the generated files in `dist/`.

## Security notes (read before going live)

- `smart_gateway` is registered with `auth => false`; the only protection is the HMAC token, and its secret (`MY_SUPER_SECRET_123`) has to ship inside the browser bundle. Anyone who opens the app can sign requests and read or change **any** module, including `Users`. A `fetch` on `Users` without a `fields` list also returns password hashes.
- Role checks in the React app are for the UI only; the gateway does not enforce them.
- Before production: issue a per-user session token from `taskflow_auth` and check it (and the role) in the gateway, restrict which modules and fields it exposes, and change the secret.
