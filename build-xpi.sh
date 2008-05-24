rm -rf `find ./ -name ".DS_Store"`
rm -rf `find ./ -name "Thumbs.db"`
rm links-like-this.xpi
rm -rf .tmp_xpi_dir/

chmod -R 0777 links-like-this/

mkdir .tmp_xpi_dir/
cp -r links-like-this/* .tmp_xpi_dir/
rm -rf `find ./.tmp_xpi_dir/ -name ".svn"`

cd .tmp_xpi_dir/chrome/
zip -rq ../links-like-this.jar *
rm -rf *
mv ../links-like-this.jar ./
cd ../
zip -rq ../links-like-this.xpi *
cd ../
rm -rf .tmp_xpi_dir/

cp links-like-this.xpi ~/Desktop/