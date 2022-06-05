///@ts-nocheck

const fs = require('fs');
const path = require('path');

GMEdit.register('plugin-manager', {
  init: (state) => {
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
