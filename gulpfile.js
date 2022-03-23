let project_folder = require("path").basename(__dirname); //*создаем переменнную, которая будет задавать путь сохранения нашего проекта
let source_folder = "#src"; //*создаем переменнную, которая будет задавать путь к исходникам

let fs = require('fs'); //*создаем переменнную, которая будет подключать шрифты к CSS

let path = {
	build: {
		html: project_folder + "/", //?указываем путь к HTML
		css: project_folder + "/css/", //?указываем путь к CSS
		js: project_folder + "/js/",
		img: project_folder + "/img/",
		fonts: project_folder + "/fonts/",
	},
	src: {
		html: [source_folder + "/*.html", "!"+ source_folder + "/_*.html"], //?указываем путь к HTML c исходниками, исключая файлы, которые начинаются с _
		css: source_folder + "/scss/style.scss", //?указываем путь к CSS
		js: source_folder + "/js/script.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,jpeg,webp}",
		fonts: source_folder + "/fonts/*.ttf",
	},
	watch: {
		html: source_folder + "/**/*.html", //?слушаем все файлы HTML
		css: source_folder + "/scss/**/*.scss", //?слушаем все файлы CSS
		js: source_folder + "/js/**/*.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,jpeg,webp}",
	},
	clean: "./" + project_folder + "/" //?будет удалять папку когда запускается GULP
}

let { src, dest } = require('gulp'),
	gulp = require('gulp'),
	browsersync = require("browser-sync").create(),
	fileinclude = require("gulp-file-include"), //?Подключаем плагин file-include
	del = require("del"), //?Подключаем плагин del, который чистит папку dist
	scss = require('gulp-sass')(require('sass')), //? Объявляем переменную для подключения плагина del, который чистит папку dist
	autoprefixer = require("gulp-autoprefixer"), //? Объявляем переменную для подключения плагина autoprefixer
	group_media = require("gulp-group-css-media-queries"), //? Объявляем переменную для подключения плагина media-queries
	clean_css = require("gulp-clean-css"), //? Объявляем переменную для подключения плагина clean-css оптимизирует наш CSS - чистсит и сжимает
	rename = require("gulp-rename"), //? Объявляем переменную для подключения плагина rename переименовывает stale.css stale.min.css
	webphtml = require("gulp-webp-html"), //? Объявляем переменную для подключения плагина webp html интегрирует изображение в HTML
	imagemin = require("gulp-imagemin"), //? Объявляем переменную для подключения плагина imagemin для оптимизации изображений
	webp = require("gulp-webp"), //? Объявляем переменную для подключения плагина webp для конвертации изображений в HTML
	uglify = require("gulp-uglify-es").default, //? Объявляем переменную для подключения плагина uglify оптимизирует наш JS - чистсит и сжимает
	webpcss = require("gulp-webpcss"), //? Объявляем переменную для подключения плагина webpcss, который интегрируется в CSS
	svgSprite = require("gulp-svg-sprite"); //? Объявляем переменную для подключения SVG-спрайтов
	ttf2woff = require("gulp-ttf2woff"), //? Объявляем переменную для подключения шрифтов ttf
	ttf2woff2 = require("gulp-ttf2woff2"), //? Объявляем переменную для подключения шрифтов ttf
	fonter = require("gulp-fonter"); //? Объявляем переменную для подключения шрифтов otf


function browserSync(params) {
	browsersync.init({
		server: {
			baseDir: "./" + project_folder + "/"
		},
		port: 3000,
		notify: false,
	})
}
//? Создаем фукцию для работы с HTML

function html() {
	return src(path.src.html)
		.pipe(fileinclude()) //? Собирает HTML файлы
		.pipe(webphtml()) //? Интегрирует файлы webp в HTML
		.pipe(dest(path.build.html)) //? функция выгружет HTML файлы
		.pipe(browsersync.stream()) //? Обновляет страницу
}

//? Создаем фукцию для работы с CSS
function css() {
	return src(path.src.css)
		.pipe (
		scss({
				outputStyle: "expanded" //? не собирает CSS в "кашу"
			})
		)
		.pipe(
			autoprefixer({
				overrideBrowserslist: ["last 5 versions"], //? Последние 5 версий браузера
				cascade: true //? Стиль
			})
		)
		.pipe(webpcss()) //{webpClass: '.webp',noWebpClass: '.no-webp'}
		.pipe(dest(path.build.css)) //? выгружаем обычный CSS файл, далее:
		.pipe(group_media({})) //? собирает все медиазапросы в одно место
		.pipe(clean_css({})) //? оптимизирует CSS файл
		.pipe(
			rename({
				extname: ".min.css" //? выводит stale.min.css
			})
		)
		.pipe(dest(path.build.css)) //? функция внутри кторой пишем команды для GULP
		.pipe(browsersync.stream()) //? Обновляет страницу
}

//? Создаем фукцию для работы с JavaScript
function js() {
	return src(path.src.js)
		.pipe(fileinclude()) //? Собирает JS файлы
		.pipe(dest(path.build.js)) //? функция внутри кторой пишем команды для GULP
		.pipe(browsersync.stream()) //? Обновляет страницу
		.pipe(dest(path.build.js)) //? выгружаем обычный JS файл, далее:
		.pipe(uglify({}))
		.pipe(
			rename({
				extname: ".min.js" //? выводит script.min.js
			})
		)
		.pipe(dest(path.build.js))
}

//? Создаем фукцию для работы с файлами изображений
function images() {
	return src(path.src.img) //? обращаемся к исходникам
		.pipe(
			webp({
				quality:70
			})
		)
		.pipe(dest(path.build.img)) //? функция для выгрузки файлов после webp
		.pipe(src(path.src.img)) //? опять обращаемся к исходникам, и уже после этого идет обработка остальных изображений
		.pipe(
			imagemin({ //? оптимизирует изображения
				progressive: true,
				svgoPlagins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3, //* от 0 до 7
			})
		)
		.pipe(dest(path.build.img)) //? функция для выгрузки файлов
		.pipe(browsersync.stream()) //? Обновляет страницу
}


//? Создаем фукцию для работы с svgSprite запускается вручную командой 'gulp svgSprite'
gulp.task('svgSprite', function(){
	return gulp.src([source_folder + '/iconsprite/*.svg'])
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: "../icons/icons.svg",
					example: true, // создает html-файл с примерами иконок
				}
			},
		}))
		.pipe(dest(path.build.img));
})


//? Создаем фукцию для экспорта ttf в woff и woff2

function fonts(params) {
	src(path.src.fonts)
	.pipe(ttf2woff())
	.pipe(dest(path.build.fonts))
	return src(path.src.fonts)
	.pipe(ttf2woff2())
	.pipe(dest(path.build.fonts))
}

//? Создаем фукцию для работы с otf - шрифтами запускается вручную командой 'gulp otf2ttf'
gulp.task('otf2ttf', function(){
	return gulp.src([source_folder + '/fonts/*.otf'])
		.pipe(fonter({
			formats: ['ttf']
		}))
		.pipe(dest(source_folder + '/fonts/'));
})


//? Создаем фукцию для работы с подключением шрифтов - она будет записывать имена файлов
function fontsStyle(params) {
	let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
	if (file_content == '') { fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
	return fs.readdir(path.build.fonts, function (err, items) { if (items) { let c_fontname;
		for (var i = 0; i < items.length; i++) {
			let fontname = items[i].split('.');
			fontname = fontname[0];
			if (c_fontname != fontname) {
				fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
			} c_fontname = fontname; } } }) }
	}

function cb() {
}


function watchFiles(params) { //? Создаем функцию которая будет следить за изменниями в файлах HTML
	gulp.watch([path.watch.html], html)
	gulp.watch([path.watch.css], css) //? Создаем функцию которая будет следить за изменниями в файлах CSS
	gulp.watch([path.watch.js], js) //? Создаем функцию которая будет следить за изменниями в файлах JS
	gulp.watch([path.watch.img], images) //? Создаем функцию которая будет следить за изменниями в файлах картинок
}


//? Создаем фукцию для работы с DEL:
function clean(params) {
	return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images,fonts), fontsStyle);
let watch = gulp.parallel(build,browserSync, watchFiles);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;