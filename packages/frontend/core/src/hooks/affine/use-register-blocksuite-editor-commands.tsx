import { toast } from '@affine/component';
import { openInfoModalAtom } from '@affine/core/atoms';
import {
  PreconditionStrategy,
  registerAffineCommand,
} from '@affine/core/commands';
import { mixpanel } from '@affine/core/mixpanel';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/properties';
import { WorkspaceFlavour } from '@affine/env/workspace';
import { useI18n } from '@affine/i18n';
import { EdgelessIcon, HistoryIcon, PageIcon } from '@blocksuite/icons/rc';
import {
  DocService,
  useLiveData,
  useService,
  WorkspaceService,
} from '@toeverything/infra';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

import { pageHistoryModalAtom } from '../../atoms/page-history';
import { useBlockSuiteMetaHelper } from './use-block-suite-meta-helper';
import { useExportPage } from './use-export-page';
import { useTrashModalHelper } from './use-trash-modal-helper';

export function useRegisterBlocksuiteEditorCommands() {
  const doc = useService(DocService).doc;
  const docId = doc.id;
  const mode = useLiveData(doc.mode$);
  const t = useI18n();
  const workspace = useService(WorkspaceService).workspace;
  const docCollection = workspace.docCollection;

  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favorite = useLiveData(favAdapter.isFavorite$(docId, 'doc'));
  const trash = useLiveData(doc.trash$);

  const setPageHistoryModalState = useSetAtom(pageHistoryModalAtom);
  const setInfoModalState = useSetAtom(openInfoModalAtom);

  const openHistoryModal = useCallback(() => {
    setPageHistoryModalState(() => ({
      pageId: docId,
      open: true,
    }));
  }, [docId, setPageHistoryModalState]);

  const openInfoModal = useCallback(() => {
    setInfoModalState(true);
  }, [setInfoModalState]);

  const { duplicate } = useBlockSuiteMetaHelper(docCollection);
  const exportHandler = useExportPage(doc.blockSuiteDoc);
  const { setTrashModal } = useTrashModalHelper(docCollection);
  const onClickDelete = useCallback(
    (title: string) => {
      setTrashModal({
        open: true,
        pageIds: [docId],
        pageTitles: [title],
      });
    },
    [docId, setTrashModal]
  );

  const isCloudWorkspace = workspace.flavour === WorkspaceFlavour.AFFINE_CLOUD;

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    const preconditionStrategy = () =>
      PreconditionStrategy.InPaperOrEdgeless && !trash;

    // TODO(@Peng): add back when edgeless presentation is ready

    // this is pretty hack and easy to break. need a better way to communicate with blocksuite editor
    // unsubs.push(
    //   registerAffineCommand({
    //     id: 'editor:edgeless-presentation-start',
    //     preconditionStrategy: () => PreconditionStrategy.InEdgeless && !trash,
    //     category: 'editor:edgeless',
    //     icon: <EdgelessIcon />,
    //     label: t['com.affine.cmdk.affine.editor.edgeless.presentation-start'](),
    //     run() {
    //       document
    //         .querySelector<HTMLElement>('edgeless-toolbar')
    //         ?.shadowRoot?.querySelector<HTMLElement>(
    //           '.edgeless-toolbar-left-part > edgeless-tool-icon-button:last-child'
    //         )
    //         ?.click();
    //     },
    //   })
    // );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-view-info`,
        preconditionStrategy: () =>
          PreconditionStrategy.InPaperOrEdgeless &&
          !trash &&
          runtimeConfig.enableInfoModal,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.affine.page-properties.page-info.view'](),
        run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'view info',
          });
          openInfoModal();
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-${favorite ? 'remove-from' : 'add-to'}-favourites`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: favorite
          ? t['com.affine.favoritePageOperation.remove']()
          : t['com.affine.favoritePageOperation.add'](),
        run() {
          favAdapter.toggle(docId, 'doc');
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: favorite ? 'remove from favourites' : 'add to favourites',
          });
          toast(
            favorite
              ? t['com.affine.cmdk.affine.editor.remove-from-favourites']()
              : t['com.affine.cmdk.affine.editor.add-to-favourites']()
          );
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-convert-to-${
          mode === 'page' ? 'edgeless' : 'page'
        }`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: `${t['Convert to ']()}${
          mode === 'page'
            ? t['com.affine.pageMode.edgeless']()
            : t['com.affine.pageMode.page']()
        }`,
        run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control:
              mode === 'page' ? 'convert to edgeless' : 'convert to page',
          });
          doc.toggleMode();
          toast(
            mode === 'page'
              ? t['com.affine.toastMessage.edgelessMode']()
              : t['com.affine.toastMessage.pageMode']()
          );
        },
      })
    );

    // TODO(@Peng): should not show duplicate for journal
    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-duplicate`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.affine.header.option.duplicate'](),
        run() {
          duplicate(docId);
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'duplicate',
          });
          mixpanel.track('DocCreated', {
            control: 'cmdk',
            type: 'doc duplicate',
            category: 'doc',
          });
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-export-to-pdf`,
        preconditionStrategy: () => mode === 'page' && !trash,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to PDF'](),
        async run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'export to pdf',
          });
          await exportHandler('pdf');
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-export-to-html`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to HTML'](),
        async run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'export to html',
          });
          await exportHandler('html');
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-export-to-png`,
        preconditionStrategy: () => mode === 'page' && !trash,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to PNG'](),
        async run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'export to png',
          });
          await exportHandler('png');
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-export-to-markdown`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['Export to Markdown'](),
        async run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'export to markdown',
          });
          await exportHandler('markdown');
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-move-to-trash`,
        preconditionStrategy,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.affine.moveToTrash.title'](),
        run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'move to trash',
          });
          onClickDelete(doc.title$.value);
        },
      })
    );

    unsubs.push(
      registerAffineCommand({
        id: `editor:${mode}-restore-from-trash`,
        preconditionStrategy: () =>
          PreconditionStrategy.InPaperOrEdgeless && trash,
        category: `editor:${mode}`,
        icon: mode === 'page' ? <PageIcon /> : <EdgelessIcon />,
        label: t['com.affine.cmdk.affine.editor.restore-from-trash'](),
        run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'restore from trash',
          });
          doc.restoreFromTrash();
        },
      })
    );

    if (isCloudWorkspace) {
      unsubs.push(
        registerAffineCommand({
          id: `editor:${mode}-page-history`,
          category: `editor:${mode}`,
          icon: <HistoryIcon />,
          label: t['com.affine.cmdk.affine.editor.reveal-page-history-modal'](),
          run() {
            mixpanel.track('QuickSearchOptionClick', {
              segment: 'cmdk',
              module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
              control: 'reveal doc history modal',
            });
            openHistoryModal();
          },
        })
      );
    }

    unsubs.push(
      registerAffineCommand({
        id: 'alert-ctrl-s',
        category: 'affine:general',
        preconditionStrategy: PreconditionStrategy.Never,
        keyBinding: {
          binding: '$mod+s',
        },
        label: '',
        icon: null,
        run() {
          mixpanel.track('QuickSearchOptionClick', {
            segment: 'cmdk',
            module: mode === 'page' ? 'doc editor' : 'whiteboard editor',
            control: 'save',
          });
          toast(t['Save']());
        },
      })
    );

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [
    favorite,
    mode,
    onClickDelete,
    exportHandler,
    t,
    trash,
    isCloudWorkspace,
    openHistoryModal,
    duplicate,
    favAdapter,
    docId,
    doc,
    openInfoModal,
  ]);
}
