import figlet from 'figlet';
import gradient from 'gradient-string';

export function printBanner(): void {
  const ascii = figlet.textSync('Xpressify', {
    font: 'Big',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.log(gradient.pastel.multiline(ascii));
  console.log(gradient.pastel('  Modern Express CLI — scaffold TypeScript projects instantly\n'));

  // Авторская подпись — выводим после основного баннера приглушённым цветом
  // чтобы не перебивать главный визуальный акцент, но быть заметным.
  console.log('  Created by David Veryutin');
  console.log('  https://github.com/davids199005-oss\n');
}
