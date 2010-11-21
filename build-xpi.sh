rm -rf `find ./ -name ".DS_Store"`
rm -rf `find ./ -name "Thumbs.db"`

rm ~/Desktop/links-like-this-latest.xpi
rm -rf .tmp_xpi_dir/

chmod -R 0777 links-like-this/

mkdir .tmp_xpi_dir/
cp -r links-like-this/* .tmp_xpi_dir/
rm -rf `find ./.tmp_xpi_dir/ -name ".git"`

cd .tmp_xpi_dir/
zip -rq ~/Desktop/links-like-this-latest.xpi *
cd ../
rm -rf .tmp_xpi_dir/