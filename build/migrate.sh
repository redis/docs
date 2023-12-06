#!/bin/bash
export WD=$PWD/..
export DOCS_SRC_FOLDER=$WD/content/tmp/docs
export DOCS_SRC_CMD_FOLDER=$WD/content/tmp/commands
export DOCS_DEV=$WD/content/develop/
export DOCS_ROOT=$WD/content/

# Use the original index.json file
cd $WD
cp ./data/components/index.json ./data/components/index.json.bkp
cp ./data/components/index_migrate.json ./data/components/index.json
python3 ./build/make.py
mv ./data/components/index.json.bkp ./data/components/index.json

# Copy commands
cp -R $DOCS_SRC_CMD_FOLDER $DOCS_ROOT/

# Only copy the developer documentation
cp -R $DOCS_SRC_FOLDER/get-started $DOCS_DEV/
cp -R $DOCS_SRC_FOLDER/connect $DOCS_DEV/
cp -R $DOCS_SRC_FOLDER/data-types $DOCS_DEV/
cp -R $DOCS_SRC_FOLDER/interact $DOCS_DEV/
cp -R $DOCS_SRC_FOLDER/manual $DOCS_DEV/use
cp -R $DOCS_SRC_FOLDER/reference $DOCS_DEV/
rm -Rf $DOCS_DEV/reference/signals
rm -Rf $DOCS_DEV/reference/cluster-spec
rm -Rf $DOCS_DEV/reference/arm
rm -Rf $DOCS_DEV/reference/internals