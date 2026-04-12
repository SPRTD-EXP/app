const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withSuppressWarnings(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return modConfig;

      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes('Wno-nullability-completeness')) return modConfig;

      const injection = [
        '  installer.pods_project.targets.each do |target|',
        '    target.build_configurations.each do |bc|',
        "      bc.build_settings['WARNING_CFLAGS'] ||= '$(inherited)'",
        "      bc.build_settings['WARNING_CFLAGS'] += ' -Wno-nullability-completeness'",
        '    end',
        '  end',
      ].join('\n');

      // Insert before the closing 'end' of the post_install block
      contents = contents.replace(
        /(post_install do \|installer\|[\s\S]*?)(^end$)/m,
        `$1${injection}\n$2`
      );

      fs.writeFileSync(podfilePath, contents);
      return modConfig;
    },
  ]);
};
