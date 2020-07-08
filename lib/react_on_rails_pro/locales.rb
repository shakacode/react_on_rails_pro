# frozen_string_literal: true

require "erb"

module ReactOnRailsPro
  class Locales
    def convert_locales
      return if i18n_dir.nil?

      ymls.each do |f|
        translation = YAML.safe_load(File.open(f))
        key = translation.keys[0]
        messages = flatten_defaults(translation[key])
        template = send("wrap_into_template", messages.to_json)

        top_level_folder = get_top_level_name(f)

        filename = File.basename(f, ".*")
        if top_level_folder == nil
        else
          path = "#{i18n_dir}/#{top_level_folder}/#{filename}.#{file_format}"
        end

        path = file(get_top_level_name(f))
        FileUtils.mkdir_p(File.dirname(path))
        generate_file(template, path)
      end 
    end

private

    def ymls
      Dir["#{i18n_yml_dir}/**/en.yml"]
    end

    def get_top_level_name(file)
      arr = file.gsub(i18n_yml_dir, '').split('/').filter(&:present?)
      if arr.length == 1
        return nil
      else
        return arr[0] 
      end
    end

    def file(name)
      "#{i18n_dir}/#{name}.js"
    end

    def i18n_dir
      @i18n_dir ||= ReactOnRails.configuration.i18n_dir
    end

    def i18n_yml_dir
      @i18n_yml_dir ||= ReactOnRails.configuration.i18n_yml_dir
    end

    def generate_file(template, path)
      result = ERB.new(template).result()
      File.open(path, "w") do |f|
        f.write(result)
      end
    end

    def format(input)
      input.to_s.tr(".", "_").camelize(:lower).to_sym
    end

    def flatten_defaults(val)
      flatten(val).each_with_object({}) do |(k, v), h|
        key = format(k)
        h[key] = { id: k, defaultMessage: v }
      end
    end

    def flatten(translations)
      translations.each_with_object({}) do |(k, v), h|
        if v.is_a? Hash
          flatten(v).map { |hk, hv| h["#{k}.#{hk}".to_sym] = hv }
        elsif v.is_a?(String)
          h[k] = v.gsub("%{", "{")
        elsif !v.is_a?(Array)
          h[k] = v
        end
      end
    end

    def wrap_into_template(messages)
      <<-JS.strip_heredoc
        import { defineMessages } from 'react-intl';

        const defaultLocale = \'#{default_locale}\';

        const defaultMessages = defineMessages(#{messages});

        export { defaultMessages, defaultLocale };
      JS
    end
  end
end
