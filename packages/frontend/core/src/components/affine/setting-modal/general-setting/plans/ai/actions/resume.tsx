import {
  Button,
  type ButtonProps,
  notify,
  useConfirmModal,
} from '@affine/component';
import { useAsyncCallback } from '@affine/core/hooks/affine-async-hooks';
import { track } from '@affine/core/mixpanel';
import { SubscriptionService } from '@affine/core/modules/cloud';
import { SubscriptionPlan } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { SingleSelectSelectSolidIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { nanoid } from 'nanoid';
import { useState } from 'react';

export const AIResume = (btnProps: ButtonProps) => {
  const t = useI18n();
  const [idempotencyKey, setIdempotencyKey] = useState(nanoid());
  const subscription = useService(SubscriptionService).subscription;

  const [isMutating, setIsMutating] = useState(false);

  const { openConfirmModal } = useConfirmModal();

  const resume = useAsyncCallback(async () => {
    const aiSubscription = subscription.ai$.value;
    if (aiSubscription) {
      track.$.settingsPanel.plans.startResuming({
        type: SubscriptionPlan.AI,
        category: aiSubscription.recurring,
      });
    }

    openConfirmModal({
      title: t['com.affine.payment.ai.action.resume.confirm.title'](),
      description:
        t['com.affine.payment.ai.action.resume.confirm.description'](),
      confirmText:
        t['com.affine.payment.ai.action.resume.confirm.confirm-text'](),
      confirmButtonOptions: {
        type: 'primary',
      },
      cancelText:
        t['com.affine.payment.ai.action.resume.confirm.cancel-text'](),
      onConfirm: async () => {
        setIsMutating(true);
        await subscription.resumeSubscription(
          idempotencyKey,
          SubscriptionPlan.AI
        );
        if (aiSubscription) {
          track.$.settingsPanel.plans.resumeSubscription({
            type: aiSubscription.plan,
            category: aiSubscription.recurring,
          });
        }
        notify({
          icon: <SingleSelectSelectSolidIcon />,
          iconColor: cssVar('processingColor'),
          title:
            t['com.affine.payment.ai.action.resume.confirm.notify.title'](),
          message:
            t['com.affine.payment.ai.action.resume.confirm.notify.msg'](),
        });
        setIdempotencyKey(nanoid());
      },
    });
  }, [subscription, openConfirmModal, t, idempotencyKey]);

  return (
    <Button loading={isMutating} onClick={resume} type="primary" {...btnProps}>
      {t['com.affine.payment.ai.action.resume.button-label']()}
    </Button>
  );
};
