<?php
/**
 * Taskflow logic hooks: create tf_Notifications records for the right people
 * whenever a task is created, reassigned, changes status, or gets a comment.
 */
if (!defined('sugarEntry') || !sugarEntry) {
    die('Not A Valid Entry Point');
}

class TaskflowHooks
{
    /** Guards against notifying twice when a hook saves another bean. */
    private static $running = false;

    public function taskSaved($bean, $event, $arguments)
    {
        if (self::$running) {
            return;
        }
        self::$running = true;
        try {
            $old = is_array($bean->fetched_row) ? $bean->fetched_row : array();
            $isNew = empty($old['id']);
            $actor = !empty($bean->last_actor_id) ? $bean->last_actor_id : $bean->owner_id;
            $actorName = $this->userName($actor);
            $title = $bean->name;

            if ($isNew) {
                $this->notify(array($bean->assigned_user_id), $actor, $bean->id, 'assigned', 'New task assigned',
                    "{$actorName} assigned you \"{$title}\"" . ($bean->date_due ? " (due {$bean->date_due})." : '.'));
                if ($bean->status === 'review') {
                    $this->notify($this->reviewersFor($bean), $actor, $bean->id, 'review', 'Review requested',
                        "{$actorName} submitted \"{$title}\" for review.");
                }
                return;
            }

            if (!empty($bean->assigned_user_id) && $bean->assigned_user_id !== $old['assigned_user_id']) {
                $this->notify(array($bean->assigned_user_id), $actor, $bean->id, 'assigned', 'Task reassigned to you',
                    "{$actorName} assigned you \"{$title}\".");
            }

            $from = isset($old['status']) ? $old['status'] : '';
            $to = $bean->status;
            if ($from === $to) {
                return;
            }
            if ($to === 'review') {
                $this->notify($this->reviewersFor($bean), $actor, $bean->id, 'review', 'Review requested',
                    "{$actorName} submitted \"{$title}\" for review.");
            } elseif ($to === 'done') {
                $this->notify(array($bean->assigned_user_id, $bean->owner_id), $actor, $bean->id, 'approved',
                    $from === 'review' ? 'Task approved' : 'Task completed',
                    "\"{$title}\" was marked done by {$actorName}.");
            } elseif ($to === 'blocked') {
                $this->notify($this->reviewersFor($bean), $actor, $bean->id, 'blocked', 'Task blocked',
                    "{$actorName} flagged \"{$title}\" as blocked.");
            } elseif ($from === 'review' && $to === 'prog') {
                $this->notify(array($bean->assigned_user_id), $actor, $bean->id, 'changes', 'Changes requested',
                    "{$actorName} asked for changes on \"{$title}\".");
            } else {
                $this->notify(array($bean->assigned_user_id), $actor, $bean->id, 'status', 'Status updated',
                    "{$actorName} moved \"{$title}\" to " . $this->statusLabel($to) . '.');
            }
        } finally {
            self::$running = false;
        }
    }

    public function commentSaved($bean, $event, $arguments)
    {
        if (!empty($bean->fetched_row) || empty($bean->tf_task_id)) {
            return; // only new comments on a task
        }
        $task = BeanFactory::getBean('tf_Tasks', $bean->tf_task_id);
        if (empty($task->id)) {
            return;
        }
        $author = $this->userName($bean->author_id);
        $text = $bean->description;
        if (strlen($text) > 80) {
            $text = substr($text, 0, 77) . '...';
        }
        $this->notify(array($task->assigned_user_id, $task->owner_id), $bean->author_id, $task->id, 'comment', 'New comment',
            "{$author} on \"{$task->name}\": {$text}");
    }

    /** Users who can review this task: top roles everywhere, team reviewers in the task's department. */
    private function reviewersFor($task)
    {
        global $db;
        $dept = $db->quote((string) $task->tf_department_id);
        $sql = "SELECT u.id FROM users u
                INNER JOIN tf_roles r ON r.id = u.tf_role_id AND r.deleted = 0
                WHERE u.deleted = 0 AND u.status = 'Active' AND r.can_review = 1
                  AND (r.can_view_all = 1 OR u.tf_department_id = '{$dept}')";
        $ids = array();
        $res = $db->query($sql);
        while ($row = $db->fetchByAssoc($res)) {
            $ids[] = $row['id'];
        }
        return $ids;
    }

    private function notify(array $userIds, $actorId, $taskId, $type, $title, $message)
    {
        $userIds = array_unique(array_filter($userIds));
        foreach ($userIds as $uid) {
            if ($uid === $actorId) {
                continue; // nobody needs a notification about their own action
            }
            $n = BeanFactory::newBean('tf_Notifications');
            $n->name = $title;
            $n->description = $message;
            $n->notif_type = $type;
            $n->is_read = 0;
            $n->assigned_user_id = $uid;
            $n->actor_id = $actorId;
            $n->tf_task_id = $taskId;
            $n->save(false);
        }
    }

    private function userName($id)
    {
        if (empty($id)) {
            return 'Someone';
        }
        $u = BeanFactory::getBean('Users', $id);
        return !empty($u->id) ? trim($u->first_name . ' ' . $u->last_name) : 'Someone';
    }

    private function statusLabel($status)
    {
        global $app_list_strings;
        return isset($app_list_strings['tf_task_status_list'][$status]) ? $app_list_strings['tf_task_status_list'][$status] : $status;
    }
}
