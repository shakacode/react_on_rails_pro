# Using Ubuntu Xenial Xerus 16.04 LTS (this is a minimal image with curl and vcs tool pre-installed):
#FROM buildpack-deps:xenial
FROM ruby:3.1.2
#FROM ubuntu:focal
ARG TARGETARCH
ARG DEBIAN_FRONTEND=noninteractive

# Install dependencies.
RUN \
  apt-get update \
  && apt-get install tzdata build-essential wget git \
     chrpath libssl-dev libxft-dev libfreetype6 \
     libfreetype6-dev libfontconfig1 libfontconfig1-dev -y

# Install Phantomjs 2.1.1:
ENV PHANTOM_JS=phantomjs-2.1.1-linux-x86_64
RUN \
 wget https://github.com/Medium/phantomjs/releases/download/v2.1.1/$PHANTOM_JS.tar.bz2 \
 && tar xvjf $PHANTOM_JS.tar.bz2 \
 && mv $PHANTOM_JS /usr/local/share \
 && ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin

# Create a directory for the application and run further commands form there.

COPY package.json ./
COPY yarn.lock ./
COPY spec/ ./spec
COPY Gemfile ./
COPY Gemfile.development_dependencies ./
COPY Gemfile.lock ./
COPY app/ ./app
COPY lib/ ./lib
COPY packages/ ./packages
COPY rakelib/ ./rakelib
COPY react_on_rails_pro.gemspec ./

# Add new user "renderer":
RUN adduser renderer

RUN chown -R renderer:renderer /Gemfile.lock
RUN chmod 777 /Gemfile.lock

USER renderer
ENV USER_HOME=/home/renderer
WORKDIR $USER_HOME

# Install Ruby 2.7.5 from source, set GEM_HOME and expose executable paths:
ENV RUBY_MAJOR_MINOR=3.1
ENV RUBY_VERSION=$RUBY_MAJOR_MINOR.2

ENV RUBY_HOME=$USER_HOME/ruby-$RUBY_VERSION
ENV GEM_HOME=$RUBY_HOME/gems
ENV PATH=$PATH:$RUBY_HOME:$RUBY_HOME/bin:$RUBY_HOME/gems/bin:

RUN gem install bundler

ENV NODE_VERSION=16.4.2
RUN \
  wget https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz \
  && tar -xvzf node-v$NODE_VERSION-linux-x64.tar.gz \
  && mv node-v$NODE_VERSION-linux-x64 nodejs \
  && rm node-v$NODE_VERSION-linux-x64.tar.gz
ENV PATH=$PATH:$USER_HOME/nodejs/bin:

ENV YARN_VERSION=1.22.19
RUN \
  wget https://github.com/yarnpkg/yarn/releases/download/v$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz \
  && mkdir yarn \
  && tar -xvzf yarn-v$YARN_VERSION.tar.gz -C yarn \
  && rm yarn-v$YARN_VERSION.tar.gz
ENV PATH=$PATH:$USER_HOME/yarn/yarn-v$YARN_VERSION/bin:

#RUN apt-get update -qq && apt-get install -y libpq-dev


RUN bundle install --verbose --without development test
RUN yarn
RUN cd specs/dummy && bundle test && yarn

CMD ["overmind", "start", "-f", "Procfile.static"]
