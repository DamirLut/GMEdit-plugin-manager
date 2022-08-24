///@ts-nocheck

import { getRepo } from './api.js';

const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

GMEdit.register('plugin-manager', {
  init: (state) => {
    const MenuListItems = [
      {
        id: 'plugin-manager-separator',
        type: 'separator',
      },
      {
        id: 'plugin-manager-open-folder',
        label: 'Open plugins folder',
        click: () => {
          child_process.exec(`start "" "${path.join(state.dir, '..')}"`);
        },
      },
    ];

    let MainMenu = $gmedit['ui.MainMenu'].menu;
    MenuListItems.forEach((element) => {
      MainMenu.append(new Electron_MenuItem(element));
    });

    const insert = (text) =>
      aceEditor.session.insert(
        {
          row: aceEditor.session.doc.getAllLines().length,
          col: 0,
        },
        text,
      );

    const header = `====== Plugin Manager ======`;

    const showPluginList = async () => {
      const plugins = $gmedit['plugins.PluginManager'].pluginList;
      insert(`\n\n${header}\n\n`);
      let i = 1;
      const editorComplied = new Date(/Editor compiled at (.*)./gm.exec(aceEditor.getValue())[1]);

      const editorRepo = await getRepo('YellowAfterlife', 'GMEdit', editorComplied.toString());
      let text = 'GMEdit:\n';
      text += `Last commit: ${new Date(editorRepo.version).toLocaleDateString()}\n`;
      if (editorRepo.messages.length) {
        text += `Changes: \n`;
      }
      editorRepo.messages.forEach((msg) => {
        text += `-- ${msg}\n`;
      });
      insert(text + '\n');

      await Promise.all(
        plugins.map(async (plugin) => {
          const pluginDir = path.join(state.dir, '..', plugin, '/config.json');
          if (fs.existsSync(pluginDir)) {
            const pluginConfig = JSON.parse(fs.readFileSync(pluginDir, 'utf-8'));
            const [owner, repo] = (pluginConfig.git || '/').split('/');
            let lastDate = pluginConfig['#last-commit'] || '';
            const pluginRepo = await getRepo(owner, repo, lastDate);
            if (!lastDate) {
              lastDate = pluginRepo.version;
              fs.writeFileSync(
                pluginDir,
                JSON.stringify({ ...pluginConfig, '#last-commit': lastDate }, null, 2),
              );
            }
            let text = `${i++}) ${plugin}\n`;
            text += `Owner: ${owner}\n`;
            text += `Last commit: ${new Date(pluginRepo.version).toLocaleDateString()}\n`;
            if (pluginRepo.messages.length) {
              text += `Changes: \n`;
            }
            pluginRepo.messages.forEach((msg) => {
              text += `-- ${msg}\n`;
            });
            insert(text + '\n');
          }
        }),
      );

      insert(`\n\n${'='.repeat(header.length)}\n\n`);
    };
    showPluginList();

    window.generatePlugin = function (name, module = true) {
      const NAME_TEMPLATES = {
        NAME: () => name,
        MODULE: () => module,
      };

      const dir = path.join(state.dir, '..', name);

      if (fs.existsSync(dir)) {
        return console.warn(`${name} plugins exists`);
      }

      fs.mkdirSync(dir);

      const templatedir = path.join(state.dir, 'template');

      const copy = fs.readdirSync(templatedir);

      copy.forEach((file) => {
        let fileData = fs.readFileSync(templatedir + '/' + file, 'utf-8');

        Object.entries(NAME_TEMPLATES).map(([word, fn]) => {
          fileData = fileData.replaceAll(`%${word}%`, fn());
        });

        fs.writeFileSync(dir + '/' + file, fileData);
      });

      return console.log('Plugin created');
    };
  },
});
