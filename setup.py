from setuptools import setup

setup(
    name='ctstream',
    version="0.1",
    author='Mario Balibrera',
    author_email='mario.balibrera@gmail.com',
    license='MIT License',
    description='Video/audio streaming plugin for cantools (ct)',
    long_description='This package includes all the machinery for building sites that feature streaming video.',
    packages=[
        'ctstream'
    ],
    zip_safe = False,
    install_requires = [
        "ct >= 0.9.2.9"
    ],
    entry_points = '''''',
    classifiers = [
        'Development Status :: 3 - Alpha',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ],
)
