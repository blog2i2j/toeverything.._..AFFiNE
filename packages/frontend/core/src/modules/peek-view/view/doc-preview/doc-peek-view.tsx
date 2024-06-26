import { Scrollable } from '@affine/component';
import { PageDetailSkeleton } from '@affine/component/page-detail-skeleton';
import { AIProvider } from '@affine/core/blocksuite/presets/ai';
import { AffineErrorBoundary } from '@affine/core/components/affine/affine-error-boundary';
import { BlockSuiteEditor } from '@affine/core/components/blocksuite/block-suite-editor';
import { useNavigateHelper } from '@affine/core/hooks/use-navigate-helper';
import { PageNotFound } from '@affine/core/pages/404';
import { Bound, type EdgelessRootService } from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { AffineEditorContainer } from '@blocksuite/presets';
import type { DocMode } from '@toeverything/infra';
import { DocsService, FrameworkScope, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { WorkbenchService } from '../../../workbench';
import { PeekViewService } from '../../services/peek-view';
import { useDoc } from '../utils';
import * as styles from './doc-peek-view.css';

function fitViewport(
  editor: AffineEditorContainer,
  xywh?: `[${number},${number},${number},${number}]`
) {
  const rootService =
    editor.host.std.spec.getService<EdgelessRootService>('affine:page');
  rootService.viewport.onResize();

  if (xywh) {
    const viewport = {
      xywh: xywh,
      padding: [60, 20, 20, 20] as [number, number, number, number],
    };
    rootService.viewport.setViewportByBound(
      Bound.deserialize(viewport.xywh),
      viewport.padding,
      false
    );
  } else {
    const data = rootService.getFitToScreenData();
    rootService.viewport.setViewport(
      data.zoom,
      [data.centerX, data.centerY],
      false
    );
  }
}

export function DocPeekPreview({
  docId,
  blockId,
  mode,
  xywh,
}: {
  docId: string;
  blockId?: string;
  mode?: DocMode;
  xywh?: `[${number},${number},${number},${number}]`;
}) {
  const { doc, workspace, loading } = useDoc(docId);
  const { jumpToTag } = useNavigateHelper();
  const workbench = useService(WorkbenchService).workbench;
  const peekView = useService(PeekViewService).peekView;
  const [editor, setEditor] = useState<AffineEditorContainer | null>(null);

  const onRef = (editor: AffineEditorContainer) => {
    setEditor(editor);
  };

  const docs = useService(DocsService);
  const [resolvedMode, setResolvedMode] = useState<DocMode | undefined>(mode);

  useEffect(() => {
    editor?.host?.updateComplete
      .then(() => {
        fitViewport(editor, xywh);
      })
      .catch(console.error);
  }, [editor, resolvedMode, xywh]);

  useEffect(() => {
    if (!mode || !resolvedMode) {
      setResolvedMode(docs.list.doc$(docId).value?.mode$.value || 'page');
    }
  }, [docId, docs.list, resolvedMode, mode]);

  useEffect(() => {
    const disposable = AIProvider.slots.requestOpenWithChat.on(() => {
      if (doc) {
        workbench.openPage(doc.id);
        peekView.close();
        // chat panel open is already handled in <DetailPageImpl />
      }
    });

    return () => {
      disposable.dispose();
    };
  }, [doc, peekView, workbench, workspace.id]);

  useEffect(() => {
    const disposableGroup = new DisposableGroup();
    if (editor) {
      editor.updateComplete
        .then(() => {
          const rootService = editor.host.std.spec.getService('affine:page');
          // doc change event inside peek view should be handled by peek view
          disposableGroup.add(
            rootService.slots.docLinkClicked.on(({ docId, blockId }) => {
              peekView.open({ docId, blockId }).catch(console.error);
            })
          );
          // TODO(@Peng): no tag peek view yet
          disposableGroup.add(
            rootService.slots.tagClicked.on(({ tagId }) => {
              jumpToTag(workspace.id, tagId);
              peekView.close();
            })
          );
        })
        .catch(console.error);
    }
    return () => {
      disposableGroup.dispose();
    };
  }, [editor, jumpToTag, peekView, workspace.id]);

  // if sync engine has been synced and the page is null, show 404 page.
  if (!doc || !resolvedMode) {
    return loading || !resolvedMode ? (
      <PageDetailSkeleton key="current-page-is-null" />
    ) : (
      <PageNotFound noPermission />
    );
  }

  return (
    <AffineErrorBoundary>
      <Scrollable.Root>
        <Scrollable.Viewport
          className={clsx('affine-page-viewport', styles.affineDocViewport)}
        >
          <FrameworkScope scope={doc.scope}>
            <BlockSuiteEditor
              ref={onRef}
              className={styles.editor}
              mode={resolvedMode}
              defaultSelectedBlockId={blockId}
              page={doc.blockSuiteDoc}
            />
          </FrameworkScope>
        </Scrollable.Viewport>
        <Scrollable.Scrollbar />
      </Scrollable.Root>
    </AffineErrorBoundary>
  );
}
