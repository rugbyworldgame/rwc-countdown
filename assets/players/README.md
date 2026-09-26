# Фотографии игроков

Полная документация фактически работающей системы и порядок добавления следующих матчей: [scripts/PLAYERS.md](../../scripts/PLAYERS.md). Этот файл сохраняет сведения об авторстве опубликованных снимков.

Единая база — `players.json`. Стабильный `id`, отображаемое имя и точные `aliases` позволяют повторно использовать фото во всех `.lineups .lineup-card li`. Для неоднозначных имён можно указать `data-player-id` на `li`. Совпадение только по фамилии намеренно не используется. Номер и капитанская пометка сохраняются. Неизвестные игроки остаются обычным текстом.

Новый снимок: сначала проверить лицензию, записать автора, исходный URL, год, лицензию и изменения; сохранить локальный WebP до 400×440 px и добавить запись. Не использовать фото с сайта клуба без разрешения. Файлы загружаются только при взаимодействии, без внешних запросов к фотохостингам. При ошибке фотографии кнопка превращается обратно в текст.

## Авторство и условия

- `finn-russell.webp`: Helene Brasseur, 12 января 2020; [оригинал](https://commons.wikimedia.org/wiki/File:Finn_Russell_2020.jpg), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Исходное кадрирование Stemoc; здесь уменьшение до 350×440 и перевод в WebP.
- `chandler-cunningham-south.webp`: Stefano Delfrate, 7 марта 2026; [оригинал](https://commons.wikimedia.org/wiki/File:Guinness_6_Nazioni_2026-_Italia_vs_Inghilterra-16-2_(cropped).jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Исходное кадрирование MarioBayo; здесь уменьшение до 363×440 и перевод в WebP. Производная также CC BY-SA 4.0.

Снимки исторические, форма на них не обозначает текущий клуб. Лицензии изображений не распространяются автоматически на остальной код сайта. Источник, авторство, год, лицензия и изменения также отображаются в карточке.

## Проверка

`/checks/player-cards.html` — неиндексируемая страница проверки живого Матч-центра при ширинах 320/375/768/1280 px. Проверить наведение и уход курсора, открытие нажатием, повторное нажатие, нажатие снаружи, Escape, Enter/Space и ArrowDown для перехода в карточку, отсутствие запросов WebP до взаимодействия. Это проверка размеров области просмотра, не эмулятор смартфона.

## Пополнение 25 сентября 2026

- `will-stuart.webp`: Stefano Delfrate, 2021; [источник](https://commons.wikimedia.org/wiki/File:Will_Stuart_2021.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Подготовка исходного файла: Stemoc. Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 2.0.
- `beno-obano.webp`: Stefano Delfrate, 2021; [источник](https://commons.wikimedia.org/wiki/File:Beno_Obano_2021.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Подготовка исходного файла: Arn6338. Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 2.0.
- `santiago-carreras.webp`: Stefano Delfrate, 2021; [источник](https://commons.wikimedia.org/wiki/File:Santiago_Carreras_2021.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Подготовка исходного файла: Arn6338. Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 2.0.
- `cameron-redpath.webp`: Stefano Delfrate, 2024; [источник](https://commons.wikimedia.org/wiki/File:Cameron_Redpath_march_2024.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Подготовка исходного файла: Arn6338. Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 2.0.
- `kepu-tuipulotu.webp`: Stefano Delfrate, 2025; [источник](https://commons.wikimedia.org/wiki/File:Kepu_Tuipulotu_u20_2025.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Подготовка исходного файла: Stemoc. Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 4.0.
- `archie-griffin.webp`: Bearas, 2025; [источник](https://commons.wikimedia.org/wiki/File:2025_Autumn_Nations_Series_Wales_vs_New_Zealand_20251122_163742_Archie_Griffin.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 4.0.

Проверенные источники и пропущенные загрузки сохранены в `scripts/player_photo_sources.json`. Сетевые ошибки не означают, что фотографии отсутствуют или запрещены; неполученные файлы в рабочую базу не включаются.

- `ellis-genge.webp`: Stefano Delfrate, 2015; [источник](https://commons.wikimedia.org/wiki/File:Ellis_Genge_2015.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Исходное кадрирование: Stemoc. Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 2.0.

- `louis-rees-zammit.webp`: Stefano Delfrate (stede64), 2023; [источник](https://commons.wikimedia.org/wiki/File:Louis_Rees-Zammit_March_2023.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Исходное кадрирование: Stemoc. Уменьшение и перевод в WebP; производная распространяется по CC BY-SA 2.0.

- `julian-montoya.webp`: Stefano Delfrate, 2024; [источник](https://commons.wikimedia.org/wiki/File:Julián_Montoya_2024.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Исходное кадрирование: Arn6338. Уменьшение до 384×440 и перевод в WebP; производная распространяется по CC BY-SA 2.0.

## Австралия — ЮАР, 27 сентября 2026

- `allan-alaalatoa.webp`: www.davidmolloyphotography.com, 2017; [источник](https://commons.wikimedia.org/wiki/File:Allan_Alaalatoa_2017.jpg), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Исходное кадрирование: Stemoc. Уменьшение и перевод в WebP.
- `ben-donaldson.webp`: Stefano Delfrate, 2022; [источник](https://commons.wikimedia.org/wiki/File:Ben_Donaldson_2022_(cropped).jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Исходное кадрирование: Xirkan. Уменьшение и перевод в WebP. Производная распространяется по CC BY-SA 2.0.
- `paul-de-villiers.webp`: Stefano Delfrate, 2022; [источник](https://commons.wikimedia.org/wiki/File:Paul_de_Villiers_2022.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Кадрирование исходного файла сохранено. Уменьшение и перевод в WebP. Производная распространяется по CC BY-SA 2.0.
- `ox-nche.webp`: Stefano Delfrate, 2015; [источник](https://commons.wikimedia.org/wiki/File:Ox_Nché_2015.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Исходное кадрирование: Stemoc. Уменьшение и перевод в WebP. Производная распространяется по CC BY-SA 2.0.
- `jasper-wiese.webp`: US Embassy Johannesburg, South Africa, 2026; [источник](https://commons.wikimedia.org/wiki/File:Jasper_Wiese_2026.jpg), [Public domain (PD-USGov-State)](https://commons.wikimedia.org/wiki/Template:PD-USGov-State). Кадрирование исходного файла сохранено. Уменьшение и перевод в WebP.
- `herschel-jantjies.webp`: Stefano Delfrate, 2022; [источник](https://commons.wikimedia.org/wiki/File:Herschel_Jantjies_Zebre_2022.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Исходное кадрирование: Stemoc. Уменьшение и перевод в WebP. Производная распространяется по CC BY-SA 2.0.
- `malcolm-marx.webp`: 江戸村のとくぞう, 2021; [источник](https://commons.wikimedia.org/wiki/File:Malcolm_Marx_210227b.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Кадрирование исходного файла сохранено. Уменьшение и перевод в WebP. Производная распространяется по CC BY-SA 4.0.
- `lood-de-jager.webp`: @sebastian1906, 2015; [источник](https://commons.wikimedia.org/wiki/File:Lood_de_Jager_2015_RWC.jpg), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Исходное кадрирование: Arvedui89. Уменьшение и перевод в WebP.
- `morne-van-den-berg.webp`: US Embassy Johannesburg, South Africa, 2026; [источник](https://commons.wikimedia.org/wiki/File:Morné_van_den_Berg_2026.jpg), [Public domain (PD-USGov-State)](https://commons.wikimedia.org/wiki/Template:PD-USGov-State). Кадрирование исходного файла сохранено. Уменьшение и перевод в WebP.
- `sacha-feinberg-mngomezulu.webp`: Stefano Delfrate, 2022; [источник](https://commons.wikimedia.org/wiki/File:Sacha_Mngomezulu_2022.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Исходное кадрирование: Stemoc. Уменьшение и перевод в WebP. Производная распространяется по CC BY-SA 2.0.
