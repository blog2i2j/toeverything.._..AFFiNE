// let '$' stands for unspecific matrix
/* eslint-disable rxjs/finnish */
export interface Events {
  $: {
    $: {
      $: ['createWorkspace', 'createSubscription'];
      auth: ['oauth', 'signIn', 'signUp'];
    };
    settingsPanel: {
      menu: ['goto'];
      workspace: ['viewPlans'];
      profileAndBadge: ['viewPlans'];
      accountUsage: ['changePlan'];
      accountSettings: ['uploadAvatar', 'removeAvatar', 'updateUserName'];
      plans: [
        'startUpgrading',
        'startChanging',
        'changeRecurring',
        'startCanceling',
        'cancelSubscription',
        'startResuming',
        'resumeSubscription',
      ];
      billing: ['upgrade', 'bookDemo'];
      about: [
        'checkUpdates',
        'downloadUpdate',
        'toggleAutoDownload',
        'toggleAutoCheckUpdates',
      ];
    };
    cmdk: {
      $: ['createDoc'];
      settings: ['openSettings', 'openAccountSettings', 'changeLanguage'];
    };
    navigationPanel: {
      $: [
        'quickSearch',
        'createDoc',
        'goToAllPage',
        'goToJournals',
        'openSettings',
      ];
      docs: [
        'createDoc',
        'renameDoc',
        'linkDoc',
        'deleteDoc',
        'openInSplitView',
        'toggleFavoriteDoc',
      ];
      collections: [
        'createDoc',
        'openInSplitView',
        'deleteCollection',
        'createDoc',
        'addDocToCollection',
        'toggleFavoriteCollection',
        'renameCollection',
      ];
      folders: [
        'createFolder',
        'renameFolder',
        'moveFolder',
        'deleteFolder',
        'createDoc',
        'linkCollection',
        'linkTag',
        'linkDoc',
        'unlinkCollection',
        'unlinkTag',
        'unlinkDoc',
      ];
      tags: [
        'createTag',
        'renameTag',
        'createDoc',
        'addTagToDoc',
        'openInSplitView',
        'toggleFavoriteTag',
      ];
      favorites: ['addFavorite', 'orderFavorite'];
      migrationData: [
        'clearMigrationData',
        'confirmClearMigrationData',
        'openMigrationDataHelp',
      ];
      bottomButtons: [
        'downloadApp',
        'quitAndInstall',
        'openChangelog',
        'dismissChangelog',
      ];
      others: ['openTrash', 'export'];
      workspaceList: [
        'show',
        'signIn',
        'createWorkspace',
        'createDoc',
        'openAccountSettings',
      ];
      profileAndBadge: ['openAccountSettings'];
    };
    aiOnboarding: {
      dialog: ['viewPlans'];
    };
    docHistory: {
      $: ['open', 'close', 'switchPageMode', 'viewPlans'];
    };
    paywall: {
      storage: ['viewPlans'];
      aiAction: ['viewPlans'];
    };
    header: {
      actions: ['createDoc', 'createWorkspace', 'switchPageMode'];
      share: ['createShareLink', 'copyShareLink', 'export'];
    };
  };
  doc: {
    editor: {
      slashMenu: ['linkDoc', 'createDoc'];
      atMenu: ['linkDoc'];
      formatToolbar: ['bold'];
    };
  };
  edgeless: {
    editor: {
      formatToolbar: ['drawConnector'];
    };
  };
  workspace: {
    $: {
      $: ['upgradeWorkspace'];
    };
  };
  allDocs: {
    header: {
      actions: ['createDoc', 'createWorkspace'];
    };
    list: {
      docMenu: ['createDoc'];
    };
  };
  // remove when type added
  // eslint-disable-next-line @typescript-eslint/ban-types
  collection: {};
  // remove when type added
  // eslint-disable-next-line @typescript-eslint/ban-types
  tag: {};
  // remove when type added
  // eslint-disable-next-line @typescript-eslint/ban-types
  trash: {};
}
