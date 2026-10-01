# EXAMPLE: home_vecsets
# STEP_START import
require 'redis'
require 'informers'
# STEP_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START model
# `informers` is a Ruby port of Hugging Face transformers that runs the
# ONNX-exported `all-MiniLM-L6-v2` encoder locally through `onnxruntime`.
# `Informers.pipeline("embedding", ...)` returns a callable that maps a
# string to a 384-element `Array<Float>`.
model = Informers.pipeline('embedding', 'sentence-transformers/all-MiniLM-L6-v2')
# STEP_END

# STEP_START data
people_data = {
  'Marie Curie' => {
    born: 1867, died: 1934,
    description: 'Polish-French chemist and physicist. The only person ' \
      'ever to win two Nobel prizes for two different sciences.'
  },
  'Linus Pauling' => {
    born: 1901, died: 1994,
    description: 'American chemist and peace activist. One of only two ' \
      'people to win two Nobel prizes in different fields ' \
      '(chemistry and peace).'
  },
  'Freddie Mercury' => {
    born: 1946, died: 1991,
    description: 'British musician, best known as the lead singer of the ' \
      'rock band Queen.'
  },
  'Marie Fredriksson' => {
    born: 1958, died: 2019,
    description: 'Swedish multi-instrumentalist, mainly known as the lead ' \
      'singer and keyboardist of the band Roxette.'
  },
  'Paul Erdos' => {
    born: 1913, died: 1996,
    description: 'Hungarian mathematician, known for his eccentric ' \
      'personality almost as much as his contributions to many different ' \
      'fields of mathematics.'
  },
  'Maryam Mirzakhani' => {
    born: 1977, died: 2017,
    description: 'Iranian mathematician. The first woman ever to win the ' \
      'Fields medal for her contributions to mathematics.'
  },
  'Masako Natsume' => {
    born: 1957, died: 1985,
    description: 'Japanese actress. She was very famous in Japan but was ' \
      'primarily known elsewhere in the world for her portrayal of ' \
      'Tripitaka in the TV series Monkey.'
  },
  'Chaim Topol' => {
    born: 1935, died: 2023,
    description: "Israeli actor and singer, usually credited simply as " \
      "'Topol'. He was best known for his many appearances as Tevye in " \
      'the musical Fiddler on the Roof.'
  }
}
# STEP_END

# STEP_START connect
r = Redis.new
# STEP_END

# REMOVE_START
r.del('famousPeople')
# REMOVE_END

# STEP_START add_data
people_data.each do |name, details|
  embedding = model.(details[:description], pooling: 'mean', normalize: true)

  r.vadd(
    'famousPeople',
    embedding,
    name,
    attributes: { born: details[:born], died: details[:died] }
  )
end
# STEP_END

# STEP_START basic_query
query_value = 'actors'

actors_results = r.vsim(
  'famousPeople',
  vector: model.(query_value, pooling: 'mean', normalize: true)
)

puts "'actors': #{actors_results}"
# >>> 'actors': ["Masako Natsume", "Chaim Topol", "Linus Pauling",
# "Marie Fredriksson", "Maryam Mirzakhani", "Marie Curie",
# "Freddie Mercury", "Paul Erdos"]
# REMOVE_START
assert_equal(
  ['Masako Natsume', 'Chaim Topol', 'Linus Pauling', 'Marie Fredriksson',
   'Maryam Mirzakhani', 'Marie Curie', 'Freddie Mercury', 'Paul Erdos'],
  actors_results
)
# REMOVE_END
# STEP_END

# STEP_START limited_query
query_value = 'actors'

two_actors_results = r.vsim(
  'famousPeople',
  vector: model.(query_value, pooling: 'mean', normalize: true),
  count: 2
)

puts "'actors (2)': #{two_actors_results}"
# >>> 'actors (2)': ["Masako Natsume", "Chaim Topol"]
# REMOVE_START
assert_equal(['Masako Natsume', 'Chaim Topol'], two_actors_results)
# REMOVE_END
# STEP_END

# STEP_START entertainer_query
query_value = 'entertainer'

entertainer_results = r.vsim(
  'famousPeople',
  vector: model.(query_value, pooling: 'mean', normalize: true)
)

puts "'entertainer': #{entertainer_results}"
# >>> 'entertainer': ["Chaim Topol", "Freddie Mercury",
# "Marie Fredriksson", "Linus Pauling", "Masako Natsume", "Paul Erdos",
# "Maryam Mirzakhani", "Marie Curie"]
# REMOVE_START
assert_equal(
  ['Chaim Topol', 'Freddie Mercury', 'Marie Fredriksson', 'Linus Pauling',
   'Masako Natsume', 'Paul Erdos', 'Maryam Mirzakhani', 'Marie Curie'],
  entertainer_results
)
# REMOVE_END
# STEP_END

query_value = 'science'

science_results = r.vsim(
  'famousPeople',
  vector: model.(query_value, pooling: 'mean', normalize: true)
)

puts "'science': #{science_results}"
# >>> 'science': ["Marie Curie", "Linus Pauling", "Maryam Mirzakhani",
# "Paul Erdos", "Marie Fredriksson", "Freddie Mercury", "Masako Natsume",
# "Chaim Topol"]
# REMOVE_START
assert_equal(
  ['Marie Curie', 'Linus Pauling', 'Maryam Mirzakhani', 'Paul Erdos',
   'Marie Fredriksson', 'Freddie Mercury', 'Masako Natsume', 'Chaim Topol'],
  science_results
)
# REMOVE_END

# STEP_START filtered_query
query_value = 'science'

science2000_results = r.vsim(
  'famousPeople',
  vector: model.(query_value, pooling: 'mean', normalize: true),
  filter: '.died < 2000'
)

puts "'science2000': #{science2000_results}"
# >>> 'science2000': ["Marie Curie", "Linus Pauling", "Paul Erdos",
# "Freddie Mercury", "Masako Natsume"]
# REMOVE_START
assert_equal(
  ['Marie Curie', 'Linus Pauling', 'Paul Erdos', 'Freddie Mercury',
   'Masako Natsume'],
  science2000_results
)
# REMOVE_END
# STEP_END
