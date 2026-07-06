use POSIX qw(strftime);
$datestring = strftime "%a %b %e %H:%M:%S %Y", localtime;

ensure_path('TEXINPUTS', '..');
my @subdirs = grep { -d } glob '*';


open(LOGH, "+>hip.log") or die $!;

print LOGH "$datestring\n";

for my $dir (@subdirs) {
  my $flag = 0;
  if (not -e "$dir/$dir.pdf") {
    print LOGH "$dir/$dir.pdf does not exists\n";
    $flag = 1;
  } else {
    my $texd = (stat("$dir/$dir.tex"))[9];
    my $pdfd = (stat("$dir/$dir.pdf"))[9];
    my $hipd = (stat("hipatia.cls"))[9];
    $flag = (($texd > $pdfd) || ($hipd > $pdfd)) ? 1 : 0;
    print LOGH "texd: $texd, pdfd: $pdfd, hipd: $hipd, flag: $flag\n";
  }
  if ($flag) {
    print LOGH "Generating $dir.pdf\n";
    system("cd $dir; latexmk -f -lualatex $dir; cd -");
  }
}

