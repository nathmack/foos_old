Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network "private_network", ip: "192.168.33.11"
  config.vm.network "public_network", bridge: 'en0: Wi-Fi (AirPort)'
  config.vm.synced_folder ".", "/vagrant" # , type: "rsync", rsync__exclude: ".git/"

  config.vm.provider "virtualbox" do |vb|
      vb.memory = "1024"
      # vb.gui = true
  end
  config.vm.provision "shell", inline: <<-SHELL
      export DEBIAN_FRONTEND=noninteractive
      echo "mysql-server-5.6 mysql-server/root_password_again password " | debconf-set-selections
      echo "mysql-server-5.6 mysql-server/root_password password " | debconf-set-selections

      apt-get update &>>/var/log/vagrant-provision.log
      add-apt-repository -y ppa:nginx/stable &>>/var/log/vagrant-provision.log

      echo "Installing Base packages"
      apt-get -qq install -y git git-core make ntp libcurl4-openssl-dev unzip \
                   build-essential libreadline-dev libgmp-dev \
                   language-pack-en php5 mysql-server-5.6 apache2 &>>/var/log/vagrant-provision.log

      mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root mysql &>>/var/log/vagrant-provision.log

      echo "Provisioning complete, have a nice day :)"
      sudo cp -R vagrant/* /etc/

      sudo usermod -a -G vagrant www-data
      ln -s /vagrant /var/www/html/vagrant
      chown www-data:www-data /var/www/html/vagrant
      service apache2 restart
  SHELL
end
