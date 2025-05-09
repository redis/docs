---
Title: Permissions
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the permissions used with Redis Enterprise Software REST API
  calls.
linkTitle: Permissions
weight: 60
url: '/operate/rs/7.8/references/rest-api/permissions/'
---

Some Redis Enterprise [REST API requests]({{< relref "/operate/rs/7.8/references/rest-api/requests" >}}) may require the user to have specific permissions.

Administrators can assign a predefined role to a user with the [Cluster Manager UI]({{< relref "/operate/rs/7.8/security/access-control/create-users" >}}) or a [<nobr>`PUT /v1/users/{uid}`</nobr> API request]({{< relref "/operate/rs/7.8/references/rest-api/requests/users#put-user" >}}) to grant necessary permissions to them.

## Roles

Each user in the cluster has an assigned cluster management role, which defines the permissions granted to the user.

Available management roles include:

- **none**: No REST API permissions.
- **[db_viewer](#db-viewer-role)**: Can view database info.
- **[db_member](#db-member-role)**: Can create or modify databases and view their info.
- **[cluster_viewer](#cluster-viewer-role)**: Can view cluster and database info.
- **[cluster_member](#cluster-member-role)**: Can modify the cluster and databases and view their info.
- **[user_manager](#user-manager-role)**: Can modify users and view their info.
- **[admin](#admin-role)**: Can view and modify all elements of the cluster.

## Permissions list for each role

| Role | Permissions |
|------|-------------|
| none | No permissions |
| <a name="admin-role"></a>admin | [add_cluster_module](#add_cluster_module), [cancel_cluster_action](#cancel_cluster_action), [cancel_node_action](#cancel_node_action), [config_ldap](#config_ldap), [config_ocsp](#config_ocsp), [create_bdb](#create_bdb), [create_crdb](#create_crdb), [create_ldap_mapping](#create_ldap_mapping), [create_new_user](#create_new_user), [create_redis_acl](#create_redis_acl), [create_role](#create_role), [delete_bdb](#delete_bdb), [delete_cluster_module](#delete_cluster_module), [delete_crdb](#delete_crdb), [delete_ldap_mapping](#delete_ldap_mapping), [delete_redis_acl](#delete_redis_acl), [delete_role](#delete_role), [delete_user](#delete_user), [edit_bdb_module](#edit_bdb_module), [failover_shard](#failover_shard), [flush_crdb](#flush_crdb), [install_new_license](#install_new_license), [migrate_shard](#migrate_shard), [purge_instance](#purge_instance), [reset_bdb_current_backup_status](#reset_bdb_current_backup_status), [reset_bdb_current_export_status](#reset_bdb_current_export_status), [reset_bdb_current_import_status](#reset_bdb_current_import_status), [start_bdb_export](#start_bdb_export), [start_bdb_import](#start_bdb_import), [start_bdb_recovery](#start_bdb_recovery), [start_cluster_action](#start_cluster_action), [start_node_action](#start_node_action), [test_ocsp_status](#test_ocsp_status), [update_bdb](#update_bdb), [update_bdb_alerts](#update_bdb_alerts), [update_bdb_with_action](#update_bdb_with_action), [update_cluster](#update_cluster), [update_crdb](#update_crdb), [update_ldap_mapping](#update_ldap_mapping), [update_node](#update_node), [update_proxy](#update_proxy), [update_redis_acl](#update_redis_acl), [update_role](#update_role), [update_user](#update_user), [view_all_bdb_stats](#view_all_bdb_stats), [view_all_bdbs_alerts](#view_all_bdbs_alerts), [view_all_bdbs_info](#view_all_bdbs_info), [view_all_ldap_mappings_info](#view_all_ldap_mappings_info), [view_all_nodes_alerts](#view_all_nodes_alerts), [view_all_nodes_checks](#view_all_nodes_checks), [view_all_nodes_info](#view_all_nodes_info), [view_all_nodes_stats](#view_all_nodes_stats), [view_all_proxies_info](#view_all_proxies_info), [view_all_redis_acls_info](#view_all_redis_acls_info), [view_all_roles_info](#view_all_roles_info), [view_all_shard_stats](#view_all_shard_stats), [view_all_users_info](#view_all_users_info), [view_bdb_alerts](#view_bdb_alerts), [view_bdb_info](#view_bdb_info), [view_bdb_recovery_plan](#view_bdb_recovery_plan), [view_bdb_stats](#view_bdb_stats), [view_cluster_alerts](#view_cluster_alerts), [view_cluster_info](#view_cluster_info), [view_cluster_keys](#view_cluster_keys), [view_cluster_modules](#view_cluster_modules), [view_cluster_stats](#view_cluster_stats), [view_crdb](#view_crdb), [view_crdb_list](#view_crdb_list), [view_crdb_task](#view_crdb_task), [view_crdb_task_list](#view_crdb_task_list), [view_debugging_info](#view_debugging_info), [view_endpoint_stats](#view_endpoint_stats), [view_ldap_config](#view_ldap_config), [view_ldap_mapping_info](#view_ldap_mapping_info), [view_license](#view_license), [view_logged_events](#view_logged_events), [view_node_alerts](#view_node_alerts), [view_node_check](#view_node_check), [view_node_info](#view_node_info), [view_node_stats](#view_node_stats), [view_ocsp_config](#view_ocsp_config), [view_ocsp_status](#view_ocsp_status), [view_proxy_info](#view_proxy_info), [view_redis_acl_info](#view_redis_acl_info), [view_redis_pass](#view_redis_pass), [view_role_info](#view_role_info), [view_shard_stats](#view_shard_stats), [view_status_of_all_node_actions](#view_status_of_all_node_actions), [view_status_of_cluster_action](#view_status_of_cluster_action), [view_status_of_node_action](#view_status_of_node_action), [view_user_info](#view_user_info) |
| <a name="cluster-member-role"></a>cluster_member | [create_bdb](#create_bdb), [create_crdb](#create_crdb), [delete_bdb](#delete_bdb), [delete_crdb](#delete_crdb), [edit_bdb_module](#edit_bdb_module), [failover_shard](#failover_shard), [flush_crdb](#flush_crdb), [migrate_shard](#migrate_shard), [purge_instance](#purge_instance), [reset_bdb_current_backup_status](#reset_bdb_current_backup_status), [reset_bdb_current_export_status](#reset_bdb_current_export_status), [reset_bdb_current_import_status](#reset_bdb_current_import_status), [start_bdb_export](#start_bdb_export), [start_bdb_import](#start_bdb_import), [start_bdb_recovery](#start_bdb_recovery), [update_bdb](#update_bdb), [update_bdb_alerts](#update_bdb_alerts), [update_bdb_with_action](#update_bdb_with_action), [update_crdb](#update_crdb), [view_all_bdb_stats](#view_all_bdb_stats), [view_all_bdbs_alerts](#view_all_bdbs_alerts), [view_all_bdbs_info](#view_all_bdbs_info), [view_all_nodes_alerts](#view_all_nodes_alerts), [view_all_nodes_checks](#view_all_nodes_checks), [view_all_nodes_info](#view_all_nodes_info), [view_all_nodes_stats](#view_all_nodes_stats), [view_all_proxies_info](#view_all_proxies_info), [view_all_redis_acls_info](#view_all_redis_acls_info), [view_all_roles_info](#view_all_roles_info), [view_all_shard_stats](#view_all_shard_stats), [view_bdb_alerts](#view_bdb_alerts), [view_bdb_info](#view_bdb_info), [view_bdb_recovery_plan](#view_bdb_recovery_plan), [view_bdb_stats](#view_bdb_stats), [view_cluster_alerts](#view_cluster_alerts), [view_cluster_info](#view_cluster_info), [view_cluster_keys](#view_cluster_keys), [view_cluster_modules](#view_cluster_modules), [view_cluster_stats](#view_cluster_stats), [view_crdb](#view_crdb), [view_crdb_list](#view_crdb_list), [view_crdb_task](#view_crdb_task), [view_crdb_task_list](#view_crdb_task_list), [view_debugging_info](#view_debugging_info), [view_endpoint_stats](#view_endpoint_stats), [view_license](#view_license), [view_logged_events](#view_logged_events), [view_node_alerts](#view_node_alerts), [view_node_check](#view_node_check), [view_node_info](#view_node_info), [view_node_stats](#view_node_stats), [view_proxy_info](#view_proxy_info), [view_redis_acl_info](#view_redis_acl_info), [view_redis_pass](#view_redis_pass), [view_role_info](#view_role_info), [view_shard_stats](#view_shard_stats), [view_status_of_all_node_actions](#view_status_of_all_node_actions), [view_status_of_cluster_action](#view_status_of_cluster_action), [view_status_of_node_action](#view_status_of_node_action) |
| <a name="cluster-viewer-role"></a>cluster_viewer | [view_all_bdb_stats](#view_all_bdb_stats), [view_all_bdbs_alerts](#view_all_bdbs_alerts), [view_all_bdbs_info](#view_all_bdbs_info), [view_all_nodes_alerts](#view_all_nodes_alerts), [view_all_nodes_checks](#view_all_nodes_checks), [view_all_nodes_info](#view_all_nodes_info), [view_all_nodes_stats](#view_all_nodes_stats), [view_all_proxies_info](#view_all_proxies_info), [view_all_redis_acls_info](#view_all_redis_acls_info), [view_all_roles_info](#view_all_roles_info), [view_all_shard_stats](#view_all_shard_stats), [view_bdb_alerts](#view_bdb_alerts), [view_bdb_info](#view_bdb_info), [view_bdb_recovery_plan](#view_bdb_recovery_plan), [view_bdb_stats](#view_bdb_stats), [view_cluster_alerts](#view_cluster_alerts), [view_cluster_info](#view_cluster_info), [view_cluster_modules](#view_cluster_modules), [view_cluster_stats](#view_cluster_stats), [view_crdb](#view_crdb), [view_crdb_list](#view_crdb_list), [view_crdb_task](#view_crdb_task), [view_crdb_task_list](#view_crdb_task_list), [view_endpoint_stats](#view_endpoint_stats), [view_license](#view_license), [view_logged_events](#view_logged_events), [view_node_alerts](#view_node_alerts), [view_node_check](#view_node_check), [view_node_info](#view_node_info), [view_node_stats](#view_node_stats), [view_proxy_info](#view_proxy_info), [view_redis_acl_info](#view_redis_acl_info), [view_role_info](#view_role_info), [view_shard_stats](#view_shard_stats), [view_status_of_all_node_actions](#view_status_of_all_node_actions), [view_status_of_cluster_action](#view_status_of_cluster_action), [view_status_of_node_action](#view_status_of_node_action) |
| <a name="db-member-role"></a>db_member | [create_bdb](#create_bdb), [create_crdb](#create_crdb), [delete_bdb](#delete_bdb), [delete_crdb](#delete_crdb), [edit_bdb_module](#edit_bdb_module), [failover_shard](#failover_shard), [flush_crdb](#flush_crdb), [migrate_shard](#migrate_shard), [purge_instance](#purge_instance), [reset_bdb_current_backup_status](#reset_bdb_current_backup_status), [reset_bdb_current_export_status](#reset_bdb_current_export_status), [reset_bdb_current_import_status](#reset_bdb_current_import_status), [start_bdb_export](#start_bdb_export), [start_bdb_import](#start_bdb_import), [start_bdb_recovery](#start_bdb_recovery), [update_bdb](#update_bdb), [update_bdb_alerts](#update_bdb_alerts), [update_bdb_with_action](#update_bdb_with_action), [update_crdb](#update_crdb), [view_all_bdb_stats](#view_all_bdb_stats), [view_all_bdbs_alerts](#view_all_bdbs_alerts), [view_all_bdbs_info](#view_all_bdbs_info), [view_all_nodes_alerts](#view_all_nodes_alerts), [view_all_nodes_checks](#view_all_nodes_checks), [view_all_nodes_info](#view_all_nodes_info), [view_all_nodes_stats](#view_all_nodes_stats), [view_all_proxies_info](#view_all_proxies_info), [view_all_redis_acls_info](#view_all_redis_acls_info), [view_all_roles_info](#view_all_roles_info), [view_all_shard_stats](#view_all_shard_stats), [view_bdb_alerts](#view_bdb_alerts), [view_bdb_info](#view_bdb_info), [view_bdb_recovery_plan](#view_bdb_recovery_plan), [view_bdb_stats](#view_bdb_stats), [view_cluster_alerts](#view_cluster_alerts), [view_cluster_info](#view_cluster_info), [view_cluster_modules](#view_cluster_modules), [view_cluster_stats](#view_cluster_stats), [view_crdb](#view_crdb), [view_crdb_list](#view_crdb_list), [view_crdb_task](#view_crdb_task), [view_crdb_task_list](#view_crdb_task_list), [view_debugging_info](#view_debugging_info), [view_endpoint_stats](#view_endpoint_stats), [view_license](#view_license), [view_logged_events](#view_logged_events), [view_node_alerts](#view_node_alerts), [view_node_check](#view_node_check), [view_node_info](#view_node_info), [view_node_stats](#view_node_stats), [view_proxy_info](#view_proxy_info), [view_redis_acl_info](#view_redis_acl_info), [view_redis_pass](#view_redis_pass), [view_role_info](#view_role_info), [view_shard_stats](#view_shard_stats), [view_status_of_all_node_actions](#view_status_of_all_node_actions), [view_status_of_cluster_action](#view_status_of_cluster_action), [view_status_of_node_action](#view_status_of_node_action) |
| <a name="db-viewer-role"></a>db_viewer | [view_all_bdb_stats](#view_all_bdb_stats), [view_all_bdbs_alerts](#view_all_bdbs_alerts), [view_all_bdbs_info](#view_all_bdbs_info), [view_all_nodes_alerts](#view_all_nodes_alerts), [view_all_nodes_checks](#view_all_nodes_checks), [view_all_nodes_info](#view_all_nodes_info), [view_all_nodes_stats](#view_all_nodes_stats), [view_all_proxies_info](#view_all_proxies_info), [view_all_redis_acls_info](#view_all_redis_acls_info), [view_all_roles_info](#view_all_roles_info), [view_all_shard_stats](#view_all_shard_stats), [view_bdb_alerts](#view_bdb_alerts), [view_bdb_info](#view_bdb_info), [view_bdb_recovery_plan](#view_bdb_recovery_plan), [view_bdb_stats](#view_bdb_stats), [view_cluster_alerts](#view_cluster_alerts), [view_cluster_info](#view_cluster_info), [view_cluster_modules](#view_cluster_modules), [view_cluster_stats](#view_cluster_stats), [view_crdb](#view_crdb), [view_crdb_list](#view_crdb_list), [view_crdb_task](#view_crdb_task), [view_crdb_task_list](#view_crdb_task_list), [view_endpoint_stats](#view_endpoint_stats), [view_license](#view_license), [view_node_alerts](#view_node_alerts), [view_node_check](#view_node_check), [view_node_info](#view_node_info), [view_node_stats](#view_node_stats), [view_proxy_info](#view_proxy_info), [view_redis_acl_info](#view_redis_acl_info), [view_role_info](#view_role_info), [view_shard_stats](#view_shard_stats), [view_status_of_all_node_actions](#view_status_of_all_node_actions), [view_status_of_cluster_action](#view_status_of_cluster_action), [view_status_of_node_action](#view_status_of_node_action) |
| <a name="user-manager-role"></a>user_manager | [config_ldap](#config_ldap), [create_ldap_mapping](#create_ldap_mapping), [create_new_user](#create_new_user), [create_role](#create_role), [create_redis_acl](#create_redis_acl), [delete_ldap_mapping](#delete_ldap_mapping), [delete_redis_acl](#delete_redis_acl), [delete_role](#delete_role), [delete_user](#delete_user), [install_new_license](#install_new_license), [update_ldap_mapping](#update_ldap_mapping), [update_proxy](#update_proxy), [update_role](#update_role), [update_redis_acl](#update_redis_acl), [update_user](#update_user), [view_all_bdb_stats](#view_all_bdb_stats), [view_all_bdbs_alerts](#view_all_bdbs_alerts), [view_all_bdbs_info](#view_all_bdbs_info), [view_all_ldap_mappings_info](#view_all_ldap_mappings_info), [view_all_nodes_alerts](view_all_nodes_alerts), [view_all_nodes_checks](#view_all_nodes_checks), [view_all_nodes_info](#view_all_nodes_info), [view_all_nodes_stats](#view_all_nodes_stats), [view_all_proxies_info](#view_all_proxies_info), [view_all_redis_acls_info](#view_all_redis_acls_info), [view_all_roles_info](#view_all_roles_info), [view_all_shard_stats](#view_all_shard_stats), [view_all_users_info](#view_all_users_info), [view_bdb_alerts](#view_bdb_alerts), [view_bdb_info](#view_bdb_info), [view_bdb_stats](#view_bdb_stats), [view_cluster_alerts](#view_cluster_alerts), [view_cluster_info](#view_cluster_info), [view_cluster_keys](#view_cluster_keys), [view_cluster_modules](#view_cluster_modules), [view_cluster_stats](#view_cluster_stats), [view_crdb](#view_crdb), [view_crdb_list](#view_crdb_list), [view_crdb_task](#view_crdb_task), [view_crdb_task_list](#view_crdb_task_list), [view_endpoint_stats](#view_endpoint_stats), [view_ldap_config](#view_ldap_config), [view_ldap_mapping_info](#view_ldap_mapping_info), [view_license](#view_license), [view_logged_events](#view_logged_events), [view_node_alerts](#view_node_alerts), [view_node_check](#view_node_check), [view_node_info](#view_node_info), [view_node_stats](#view_node_stats), [view_proxy_info](#view_proxy_info), [view_redis_acl_info](#view_redis_acl_info), [view_redis_pass](#view_redis_pass), [view_role_info](#view_role_info), [view_shard_stats](#view_shard_stats), [view_status_of_all_node_actions](#view_status_of_all_node_actions), [view_status_of_cluster_action](#view_status_of_cluster_action), [view_status_of_node_action](#view_status_of_node_action), [view_user_info](#view_user_info)
 |

## Roles list per permission

| Permission | Roles |
|------------|-------|
| <a name="add_cluster_module"></a>add_cluster_module| admin |
| <a name="cancel_cluster_action"></a>cancel_cluster_action | admin |
| <a name="cancel_node_action"></a>cancel_node_action | admin |
| <a name="config_ldap"></a>config_ldap | admin<br />user_manager |
| <a name="config_ocsp"></a>config_ocsp | admin |
| <a name="create_bdb"></a>create_bdb | admin<br />cluster_member<br />db_member |
| <a name="create_crdb"></a>create_crdb | admin<br />cluster_member<br />db_member |
| <a name="create_ldap_mapping"></a>create_ldap_mapping | admin<br />user_manager |
| <a name="create_new_user"></a>create_new_user | admin<br />user_manager |
| <a name="create_redis_acl"></a>create_redis_acl | admin<br />user_manager |
| <a name="create_role"></a>create_role | admin<br />user_manager |
| <a name="delete_bdb"></a>delete_bdb | admin<br />cluster_member<br />db_member |
| <a name="delete_cluster_module"></a>delete_cluster_module | admin |
| <a name="delete_crdb"></a>delete_crdb | admin<br />cluster_member<br />db_member |
| <a name="delete_ldap_mapping"></a>delete_ldap_mapping | admin<br />user_manager |
| <a name="delete_redis_acl"></a>delete_redis_acl | admin<br />user_manager |
| <a name="delete_role"></a>delete_role | admin<br />user_manager |
| <a name="delete_user"></a>delete_user | admin<br />user_manager |
| <a name="edit_bdb_module"></a>edit_bdb_module | admin<br />cluster_member<br />db_member |
| <a name="failover_shard"></a>failover_shard | admin<br />cluster_member<br />db_member |
| <a name="flush_crdb"></a>flush_crdb | admin<br />cluster_member<br />db_member |
| <a name="install_new_license"></a>install_new_license | admin<br />user_manager |
| <a name="migrate_shard"></a>migrate_shard | admin<br />cluster_member<br />db_member |
| <a name="purge_instance"></a>purge_instance | admin<br />cluster_member<br />db_member |
| <a name="reset_bdb_current_backup_status"></a>reset_bdb_current_backup_status | admin<br />cluster_member<br />db_member |
| <a name="reset_bdb_current_export_status"></a>reset_bdb_current_export_status | admin<br />cluster_member<br />db_member |
| <a name="reset_bdb_current_import_status"></a>reset_bdb_current_import_status | admin<br />cluster_member<br />db_member |
| <a name="start_bdb_export"></a>start_bdb_export | admin<br />cluster_member<br />db_member |
| <a name="start_bdb_import"></a>start_bdb_import | admin<br />cluster_member<br />db_member |
| <a name="start_bdb_recovery"></a>start_bdb_recovery | admin<br />cluster_member<br />db_member |
| <a name="start_cluster_action"></a>start_cluster_action | admin |
| <a name="start_node_action"></a>start_node_action | admin |
| <a name="test_ocsp_status"></a>test_ocsp_status | admin |
| <a name="update_bdb"></a>update_bdb | admin<br />cluster_member<br />db_member |
| <a name="update_bdb_alerts"></a>update_bdb_alerts | admin<br />cluster_member<br />db_member |
| <a name="update_bdb_with_action"></a>update_bdb_with_action | admin<br />cluster_member<br />db_member |
| <a name="update_cluster"></a>update_cluster | admin |
| <a name="update_crdb"></a>update_crdb | admin<br />cluster_member<br />db_member |
| <a name="update_ldap_mapping"></a>update_ldap_mapping | admin<br />user_manager |
| <a name="update_node"></a>update_node | admin |
| <a name="update_proxy"></a>update_proxy | admin<br />user_manager |
| <a name="update_redis_acl"></a>update_redis_acl | admin<br />user_manager |
| <a name="update_role"></a>update_role | admin<br />user_manager |
| <a name="update_user"></a>update_user | admin<br />user_manager |
| <a name="view_all_bdb_stats"></a>view_all_bdb_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_bdbs_alerts"></a>view_all_bdbs_alerts | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_bdbs_info"></a>view_all_bdbs_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_ldap_mappings_info"></a>view_all_ldap_mappings_info | admin<br />user_manager |
| <a name="view_all_nodes_alerts"></a>view_all_nodes_alerts | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_nodes_checks"></a>view_all_nodes_checks | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_nodes_info"></a>view_all_nodes_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_nodes_stats"></a>view_all_nodes_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_proxies_info"></a>view_all_proxies_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_redis_acls_info"></a>view_all_redis_acls_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_roles_info"></a>view_all_roles_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_shard_stats"></a>view_all_shard_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_all_users_info"></a>view_all_users_info | admin<br />user_manager |
| <a name="view_bdb_alerts"></a>view_bdb_alerts | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |<a
| <a name="view_bdb_info"></a>view_bdb_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_bdb_recovery_plan"></a>view_bdb_recovery_plan | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_bdb_stats"></a>view_bdb_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_cluster_alerts"></a>view_cluster_alerts | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_cluster_info"></a>view_cluster_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_cluster_keys"></a>view_cluster_keys | admin<br />cluster_member<br />user_manager |
| <a name="view_cluster_modules"></a>view_cluster_modules | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_cluster_stats"></a>view_cluster_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_crdb"></a>view_crdb | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_crdb_list"></a>view_crdb_list | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_crdb_task"></a>view_crdb_task | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_crdb_task_list"></a>view_crdb_task_list | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_debugging_info"></a>view_debugging_info | admin<br />cluster_member<br />db_member<br />user_manager |
| <a name="view_endpoint_stats"></a>view_endpoint_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_ldap_config"></a>view_ldap_config | admin<br />user_manager |
| <a name="view_ldap_mapping_info"></a>view_ldap_mapping_info | admin<br />user_manager |
| <a name="view_license"></a>view_license | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_logged_events"></a>view_logged_events | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />user_manager |
| <a name="view_node_alerts"></a>view_node_alerts | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_node_check"></a>view_node_check | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_node_info"></a>view_node_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_node_stats"></a>view_node_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_ocsp_config"></a>view_ocsp_config | admin |
| <a name="view_ocsp_status"></a>view_ocsp_status | admin |
| <a name="view_proxy_info"></a>view_proxy_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_redis_acl_info"></a>view_redis_acl_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_redis_pass"></a>view_redis_pass | admin<br />cluster_member<br />db_member<br />user_manager |
| <a name="view_role_info"></a>view_role_info | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_shard_stats"></a>view_shard_stats | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_status_of_all_node_actions"></a>view_status_of_all_node_actions | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_status_of_cluster_action"></a>view_status_of_cluster_action | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_status_of_node_action"></a>view_status_of_node_action | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer<br />user_manager |
| <a name="view_user_info"></a>view_user_info | admin<br />user_manager |
