* **CPU**: A minimum of 4 CPU cores. You should consider adding
  2-6 extra cores on top of this if your dataset is big and you want to ingest the
  baseline snapshot as fast as possible.
* **RAM**: 2GB 
* **Disk**: On top of the OS footprint,
  RDI requires 20GB in the `/var` folder and 1GB in the `/opt` folder (to
  store the log files). This allows space for upgrades.
* **Network interface**: 10GB or more.