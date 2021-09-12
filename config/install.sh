#!/bin/bash

# Get current FlexGui path
BASEDIR=$(dirname "$0")
cd $BASEDIR
cd ../www
flexgui_path=$PWD
# Create Softlink
ln -s $flexgui_path /var/www/fg
# Install Apache2
apt-get install apache2 -y
# Enable Headers
a2enmod headers
# Create config file
cd /etc/apache2/sites-available/
rm 000-flexgui.conf
touch 000-flexgui.conf
# Add FlexGui config
echo '<VirtualHost *:80>' >> 000-flexgui.conf
echo '    ServerAdmin flexgui@me.com' >> 000-flexgui.conf
echo '    ServerName localhost' >> 000-flexgui.conf
echo '    ServerAlias localhost' >> 000-flexgui.conf
echo '    DocumentRoot /var/www/fg' >> 000-flexgui.conf
echo '    ErrorLog ${APACHE_LOG_DIR}/error.log' >> 000-flexgui.conf
echo '    CustomLog ${APACHE_LOG_DIR}/access.log combined' >> 000-flexgui.conf
echo '    Header set Access-Control-Allow-Origin "*"' >> 000-flexgui.conf
echo '</VirtualHost>' >> 000-flexgui.conf
# Enable website
a2ensite 000-flexgui.conf
a2dissite 000-default.conf
# Restart Apache2
systemctl reload apache2
# Save FlexGui path
echo "export FLEXGUI_PATH='/var/www/fg'" >> ~/.bashrc
source ~/.bashrc

